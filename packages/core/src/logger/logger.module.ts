/**
 * LoggerModule — PackDefinition factory for the logger system.
 *
 * @example
 * ```typescript
 * import { LoggerModule } from '@ambrosia/core';
 *
 * const AppPack = definePack({
 *   imports: [LoggerModule.forRoot()],
 *   providers: [MyService],
 * });
 * ```
 */

import { definePack } from "../pack/define-pack.ts";
import type { AsyncPackOptions, PackDefinition } from "../pack/types.ts";
import { createAsyncProvider } from "../pack/async-pack.ts";
import { LoggerService, LOGGER_CONFIG } from "./logger.service.ts";
import type { LoggerConfig } from "./logger.types.ts";

export class LoggerModule {
  /**
   * Create the Logger pack definition with static config.
   */
  static forRoot(config?: LoggerConfig): PackDefinition {
    return definePack({
      meta: {
        name: "@ambrosia/logger",
        version: "0.1.0",
        description: "Standardized logging service",
      },
      providers: [
        { token: LOGGER_CONFIG, useValue: config ?? {} },
        LoggerService,
      ],
      exports: [LoggerService, LOGGER_CONFIG],
    });
  }

  /**
   * Create the Logger pack definition with async config.
   */
  static forRootAsync(options: AsyncPackOptions<LoggerConfig>): PackDefinition {
    return definePack({
      meta: {
        name: "@ambrosia/logger",
        version: "0.1.0",
        description: "Standardized logging service (async config)",
      },
      providers: [
        createAsyncProvider(LOGGER_CONFIG, options),
        LoggerService,
      ],
      exports: [LoggerService, LOGGER_CONFIG],
    });
  }
}
