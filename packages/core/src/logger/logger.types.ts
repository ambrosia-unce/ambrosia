/**
 * Logger types and interfaces for the standardized logging system.
 *
 * @module @ambrosia-unce/core/logger
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  level: LogLevel;
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

export interface LoggerAdapter {
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  /** Minimum log level (default: 'debug') */
  level?: LogLevel;
  /** Custom adapter for log output */
  adapter?: LoggerAdapter;
  /** JSON format (default: true in prod, false in dev) */
  json?: boolean;
  /** Include timestamps (default: true) */
  timestamp?: boolean;
  /** ANSI colors in pretty mode (default: auto-detect TTY) */
  colorize?: boolean;
}
