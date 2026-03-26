/**
 * Logging Plugin
 *
 * Enables console logging for debugging during development
 * Use this plugin instead of console.log for zero production overhead
 */

import type { IContainer } from "../interfaces/container.ts";
import type { Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";
import { ConsoleLogger, type Logger, setGlobalLogger } from "../utils/logger.ts";
import type { Plugin, ResolutionContext } from "./types.ts";

/**
 * Logging Plugin Options
 */
export interface LoggingPluginOptions {
  /** Custom logger implementation (default: ConsoleLogger) */
  logger?: Logger;

  /** Enable resolution timing logs */
  logResolutionTiming?: boolean;

  /** Enable provider registration logs */
  logProviderRegistration?: boolean;
}

/**
 * Logging Plugin
 * Enables logging throughout the DI container
 */
export class LoggingPlugin implements Plugin {
  name = "LoggingPlugin";
  version = "1.0.0";

  private logger: Logger;
  private logResolutionTiming: boolean;
  private logProviderRegistration: boolean;

  constructor(options: LoggingPluginOptions = {}) {
    this.logger = options.logger ?? new ConsoleLogger();
    this.logResolutionTiming = options.logResolutionTiming ?? false;
    this.logProviderRegistration = options.logProviderRegistration ?? false;
  }

  onContainerCreate(_container: IContainer): void {
    // Set global logger when container is created
    setGlobalLogger(this.logger);
    this.logger.info("Container created with LoggingPlugin enabled");
  }

  onBeforeResolve(token: Token, _context: ResolutionContext): void {
    if (this.logResolutionTiming) {
      this.logger.debug(`Resolving token: ${String(token)}`);
    }
  }

  onAfterResolve(token: Token, _instance: unknown, context: ResolutionContext): void {
    if (this.logResolutionTiming) {
      const duration = performance.now() - context.startTime;
      this.logger.debug(`Resolved token: ${String(token)} in ${duration.toFixed(2)}ms`);
    }
  }

  onError(error: Error, context: ResolutionContext): void {
    this.logger.error(`Resolution error for token ${String(context.token)}:`, error);
  }

  onRegisterProvider(provider: Provider): Provider {
    if (this.logProviderRegistration) {
      this.logger.debug(`Registering provider for token: ${String(provider.token)}`);
    }
    return provider;
  }
}
