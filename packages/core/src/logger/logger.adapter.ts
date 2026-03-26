/**
 * DefaultLoggerAdapter — built-in adapter that writes to stdout.
 *
 * - JSON mode: `JSON.stringify(entry)` one line per log
 * - Pretty mode: colored output like `14:32:01 INFO  [Context] Message {data}`
 * - Respects NO_COLOR env var
 * - Colors per level: debug=gray, info=cyan, warn=yellow, error=red, fatal=red+bold
 */

import type { LogEntry, LogLevel, LoggerAdapter } from "./logger.types.ts";

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR",
  fatal: "FATAL",
};

/** ANSI color codes */
const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",   // gray
  info: "\x1b[36m",    // cyan
  warn: "\x1b[33m",    // yellow
  error: "\x1b[31m",   // red
  fatal: "\x1b[1;31m", // red + bold
};

const RESET = "\x1b[0m";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export class DefaultLoggerAdapter implements LoggerAdapter {
  private json: boolean;
  private timestamp: boolean;
  private colorize: boolean;

  constructor(options?: { json?: boolean; timestamp?: boolean; colorize?: boolean }) {
    const isProd = typeof process !== "undefined" && process.env.NODE_ENV === "production";
    const noColor = typeof process !== "undefined" && !!process.env.NO_COLOR;
    const isTTY = typeof process !== "undefined" && !!(process.stdout as any)?.isTTY;

    this.json = options?.json ?? isProd;
    this.timestamp = options?.timestamp ?? true;
    this.colorize = noColor ? false : (options?.colorize ?? isTTY);
  }

  log(entry: LogEntry): void {
    if (this.json) {
      this.writeJson(entry);
    } else {
      this.writePretty(entry);
    }
  }

  private writeJson(entry: LogEntry): void {
    const output: Record<string, unknown> = {
      level: entry.level,
      message: entry.message,
    };

    if (this.timestamp) {
      output.timestamp = entry.timestamp;
    }
    if (entry.context) output.context = entry.context;
    if (entry.requestId) output.requestId = entry.requestId;
    if (entry.duration !== undefined) output.duration = entry.duration;
    if (entry.data !== undefined) output.data = entry.data;
    if (entry.error) output.error = entry.error;

    process.stdout.write(JSON.stringify(output) + "\n");
  }

  private writePretty(entry: LogEntry): void {
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(formatTime(entry.timestamp));
    }

    const label = LEVEL_LABELS[entry.level];
    if (this.colorize) {
      parts.push(`${COLORS[entry.level]}${label}${RESET}`);
    } else {
      parts.push(label);
    }

    if (entry.context) {
      if (this.colorize) {
        parts.push(`\x1b[33m[${entry.context}]${RESET}`);
      } else {
        parts.push(`[${entry.context}]`);
      }
    }

    parts.push(entry.message);

    if (entry.requestId) {
      parts.push(`(${entry.requestId})`);
    }

    if (entry.duration !== undefined) {
      parts.push(`+${entry.duration.toFixed(2)}ms`);
    }

    if (entry.data !== undefined && entry.data !== null) {
      try {
        const str = typeof entry.data === "string" ? entry.data : JSON.stringify(entry.data);
        parts.push(str);
      } catch {
        parts.push("[unserializable data]");
      }
    }

    if (entry.error) {
      parts.push(`\n  ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n${entry.error.stack}`);
      }
    }

    process.stdout.write(parts.join(" ") + "\n");
  }
}
