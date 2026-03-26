/**
 * DevToolsLogCollector — collects log entries from LoggerService
 * and maintains a circular buffer for DevTools.
 *
 * Listens for LogEntryEvent via EventBus subscription and
 * exposes the buffer to the API and SSE controllers.
 */

import { Injectable } from "@ambrosia/core";
import type { DevToolsEventEmitter } from "../types.ts";

/** Shape matching @ambrosia/core LogEntry */
export interface DevToolsLogEntry {
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  timestamp: number;
  context?: string;
  data?: unknown;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

/** Maximum number of log entries to keep in the buffer. */
const MAX_LOG_ENTRIES = 200;

@Injectable()
export class DevToolsLogCollector {
  private buffer: DevToolsLogEntry[] = [];
  private emitter: DevToolsEventEmitter | null = null;

  /**
   * Set the event emitter so log entries can be forwarded to SSE.
   */
  setEmitter(emitter: DevToolsEventEmitter): void {
    this.emitter = emitter;
  }

  /**
   * Called when a log entry arrives (from EventBus subscription).
   */
  onLog(entry: DevToolsLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > MAX_LOG_ENTRIES) {
      this.buffer.shift();
    }

    // Forward to SSE via the plugin emitter
    if (this.emitter) {
      this.emitter.emit("log:entry", entry);
    }
  }

  /**
   * Get recent log entries from the buffer.
   */
  getRecentLogs(): DevToolsLogEntry[] {
    return this.buffer;
  }

  /**
   * Get count of log entries by level.
   */
  getCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    for (const entry of this.buffer) {
      counts[entry.level] = (counts[entry.level] || 0) + 1;
    }
    return counts;
  }

  /**
   * Clear the log buffer.
   */
  clear(): void {
    this.buffer = [];
  }
}
