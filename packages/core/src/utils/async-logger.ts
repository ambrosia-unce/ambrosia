/**
 * Async Logger (Bun-optimized)
 *
 * Non-blocking logging similar to Pino
 * Uses Bun.write() for async stdout/stderr writes
 */

import { stdout, write } from "bun";
import type { Logger } from "./logger.ts";

/**
 * Async Logger Options
 */
export interface AsyncLoggerOptions {
  /** Buffer size before flushing (default: 100) */
  bufferSize?: number;

  /** Flush interval in ms (default: 100ms) */
  flushInterval?: number;

  /** Enable pretty printing (default: false for performance) */
  pretty?: boolean;
}

/**
 * Async Logger (Bun-optimized)
 * Uses buffering and async writes for zero blocking
 */
export class AsyncLogger implements Logger {
  private buffer: string[] = [];
  private readonly bufferSize: number;
  private readonly flushInterval: number;
  private flushTimer?: Timer;
  private readonly pretty: boolean;

  constructor(options: AsyncLoggerOptions = {}) {
    this.bufferSize = options.bufferSize ?? 100;
    this.flushInterval = options.flushInterval ?? 100;
    this.pretty = options.pretty ?? false;

    // Start flush interval
    this.startFlushInterval();
  }

  warn(message: string, ...args: any[]): void {
    this.log("WARN", message, args);
  }

  error(message: string, ...args: any[]): void {
    this.log("ERROR", message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log("INFO", message, args);
  }

  debug(message: string, ...args: any[]): void {
    this.log("DEBUG", message, args);
  }

  /**
   * Internal log method with buffering
   */
  private log(level: string, message: string, args: any[]): void {
    const entry = this.formatEntry(level, message, args);
    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * Format log entry
   */
  private formatEntry(level: string, message: string, args: any[]): string {
    if (this.pretty) {
      const timestamp = new Date().toISOString();
      const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
      return `[${timestamp}] ${level}: ${message}${argsStr}\n`;
    }

    return `${JSON.stringify({
      level,
      time: Date.now(),
      msg: message,
      ...(args.length > 0 && { data: args }),
    })}\n`;
  }

  /**
   * Flush buffer to stdout/stderr
   * Uses Bun.write() for async non-blocking writes
   */
  private flush(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);
    const output = entries.join("");

    // Async write using Bun.write (non-blocking)
    // Use microtask to not block current execution
    queueMicrotask(async () => {
      try {
        await write(stdout, output);
      } catch (error) {
        // Fallback to console.error (only on error)
        console.error("AsyncLogger: Failed to write logs", error);
      }
    });
  }

  /**
   * Start periodic flush
   */
  private startFlushInterval(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Cleanup on process exit
    if (typeof process !== "undefined") {
      process.on("beforeExit", () => {
        this.destroy();
      });
    }
  }

  /**
   * Force flush all buffered logs
   */
  async forceFlush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);
    const output = entries.join("");

    try {
      await write(stdout, output);
    } catch (error) {
      console.error("AsyncLogger: Failed to flush", error);
    }
  }

  /**
   * Destroy logger and flush remaining logs
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    await this.forceFlush();
  }
}

/**
 * Create a singleton async logger instance
 */
let asyncLoggerInstance: AsyncLogger | null = null;

export function getAsyncLogger(options?: AsyncLoggerOptions): AsyncLogger {
  if (!asyncLoggerInstance) {
    asyncLoggerInstance = new AsyncLogger(options);
  }
  return asyncLoggerInstance;
}
