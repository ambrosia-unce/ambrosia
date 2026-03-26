/**
 * Logger Interface
 *
 * Provides abstraction for logging without console.log performance overhead
 * Use LoggingPlugin for actual logging in development
 */

export interface Logger {
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Silent Logger (default for production)
 * No-op implementation with zero overhead
 */
export class SilentLogger implements Logger {
  warn(_message: string, ..._args: any[]): void {
    // No-op for production performance
  }

  error(_message: string, ..._args: any[]): void {
    // No-op for production performance
  }

  info(_message: string, ..._args: any[]): void {
    // No-op for production performance
  }

  debug(_message: string, ..._args: any[]): void {
    // No-op for production performance
  }
}

/**
 * Console Logger (for development)
 * Only use via LoggingPlugin to avoid performance overhead
 */
export class ConsoleLogger implements Logger {
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Global logger instance (silent by default)
 * Override with LoggingPlugin in development
 */
export let globalLogger: Logger = new SilentLogger();

/**
 * Set the global logger
 * @param logger Logger instance
 */
export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger;
}
