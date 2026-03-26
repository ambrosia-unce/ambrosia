/**
 * LoggerService — standardized logger for the Ambrosia framework.
 *
 * Features:
 * - Level-based filtering (debug, info, warn, error, fatal)
 * - Pluggable adapters for output formatting
 * - Child loggers with context scoping
 * - Optional EventBus integration (emits 'log:entry')
 * - Optional request ID from AsyncLocalStorage
 */

import { Injectable } from "../decorators/injectable.ts";
import { Inject } from "../decorators/inject.ts";
import { Optional } from "../decorators/optional.ts";
import { InjectionToken } from "../types/token.ts";
import { DefaultLoggerAdapter } from "./logger.adapter.ts";
import type { LogEntry, LogLevel, LoggerAdapter, LoggerConfig } from "./logger.types.ts";

/** Severity ordering for level filtering */
const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * InjectionToken for the LoggerConfig.
 */
export const LOGGER_CONFIG = new InjectionToken<LoggerConfig>("LOGGER_CONFIG");

/**
 * InjectionToken for an optional EventBus-like emitter.
 * This avoids a hard dependency on @ambrosia/events.
 * The EventBus is expected to have an `emit(event: object)` method.
 */
export const LOGGER_EVENT_BUS = new InjectionToken<{ emit(event: object): void | Promise<void> }>(
  "LOGGER_EVENT_BUS",
);

/**
 * InjectionToken for an optional request context provider.
 * Expected to have a `getRequestId(): string | undefined` method.
 */
export const LOGGER_REQUEST_CONTEXT = new InjectionToken<{ getRequestId(): string | undefined }>(
  "LOGGER_REQUEST_CONTEXT",
);

/**
 * Log event class emitted on EventBus when available.
 */
export class LogEntryEvent {
  constructor(public readonly entry: LogEntry) {}
}

@Injectable()
export class LoggerService {
  private level: LogLevel;
  private adapter: LoggerAdapter;
  private context?: string;
  private eventBus?: { emit(event: object): void | Promise<void> };
  private requestContext?: { getRequestId(): string | undefined };

  constructor(
    @Inject(LOGGER_CONFIG) @Optional() config?: LoggerConfig,
    @Inject(LOGGER_EVENT_BUS) @Optional() eventBus?: { emit(event: object): void | Promise<void> },
    @Inject(LOGGER_REQUEST_CONTEXT) @Optional() requestContext?: { getRequestId(): string | undefined },
  ) {
    this.level = config?.level ?? "debug";
    this.adapter = config?.adapter ?? new DefaultLoggerAdapter({
      json: config?.json,
      timestamp: config?.timestamp,
      colorize: config?.colorize,
    });
    this.eventBus = eventBus ?? undefined;
    this.requestContext = requestContext ?? undefined;
  }

  /**
   * Create a child logger with a specific context.
   */
  child(context: string): LoggerService {
    const child = Object.create(LoggerService.prototype) as LoggerService;
    child.level = this.level;
    child.adapter = this.adapter;
    child.context = context;
    child.eventBus = this.eventBus;
    child.requestContext = this.requestContext;
    return child;
  }

  /**
   * Change the adapter at runtime.
   */
  setAdapter(adapter: LoggerAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Change the minimum log level at runtime.
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, data?: unknown): void {
    this.write("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.write("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.write("error", message, data);
  }

  fatal(message: string, data?: unknown): void {
    this.write("fatal", message, data);
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_SEVERITY[level] < LEVEL_SEVERITY[this.level]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
    };

    if (this.context) {
      entry.context = this.context;
    }

    // Attach requestId from request context if available
    try {
      const requestId = this.requestContext?.getRequestId();
      if (requestId) {
        entry.requestId = requestId;
      }
    } catch {
      // Silently ignore — no active request context
    }

    // Extract error info if data is an Error instance
    if (data instanceof Error) {
      entry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack,
        code: (data as any).code,
      };
    } else if (data !== undefined) {
      entry.data = data;
    }

    this.adapter.log(entry);

    // Emit to EventBus if available
    if (this.eventBus) {
      try {
        this.eventBus.emit(new LogEntryEvent(entry));
      } catch {
        // Silently ignore — EventBus failures should not break logging
      }
    }
  }
}
