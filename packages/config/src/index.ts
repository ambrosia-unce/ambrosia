/**
 * @ambrosia/config
 *
 * Type-safe environment configuration for Ambrosia framework.
 * Parse ALL env vars ONCE at bootstrap into a frozen plain object.
 * Zero runtime overhead after initialization.
 *
 * @example
 * ```typescript
 * import { defineConfig, ConfigModule, ConfigService } from '@ambrosia/config';
 *
 * const AppConfig = defineConfig({
 *   port: { env: 'PORT', type: 'int', default: 3000 },
 *   debug: { env: 'DEBUG', type: 'bool', default: false },
 * });
 *
 * const AppPack = definePack({
 *   imports: [ConfigModule.forRoot({ schema: AppConfig })],
 * });
 * ```
 *
 * @module @ambrosia/config
 */

export { ConfigModule, defineConfig } from "./config.module.ts";
export { ConfigService } from "./config.service.ts";
export { Config, isConfigClass } from "./decorators/config.decorator.ts";
export { Env, getEnvMetadata, type EnvMetadata } from "./decorators/env.decorator.ts";
export { ConfigMissingError, ConfigParseError, parseValue } from "./parsers.ts";
export { CONFIG_SCHEMA, CONFIG_VALUES } from "./tokens.ts";
export type {
  ConfigModuleAsyncOptions,
  ConfigModuleOptions,
  ConfigSchema,
  ConfigSchemaEntry,
  ConfigType,
  InferConfigType,
  InferConfigValues,
} from "./types.ts";
