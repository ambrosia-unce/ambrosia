/**
 * Type definitions for @ambrosia/config
 */

import type { AsyncPackOptions } from "@ambrosia/core";

/**
 * Supported parser types for environment variable values.
 */
export type ConfigType = "string" | "int" | "float" | "bool" | "array" | "json";

/**
 * Schema entry defining how a single config value is parsed from env.
 */
export interface ConfigSchemaEntry {
  /** Environment variable name (e.g. 'PORT', 'DB_HOST') */
  env: string;

  /** Parser type. Defaults to 'string'. */
  type?: ConfigType;

  /** Default value if the env var is not set. */
  default?: unknown;

  /** Whether this field is required. Throws at startup if missing and no default. */
  required?: boolean;

  /** Separator for array type. Defaults to ','. */
  separator?: string;
}

/**
 * Config schema — a plain object mapping config keys to their schema entries.
 *
 * @example
 * ```ts
 * const schema = defineConfig({
 *   port: { env: 'PORT', type: 'int', default: 3000 },
 *   debug: { env: 'DEBUG', type: 'bool', default: false },
 * });
 * ```
 */
export type ConfigSchema = Record<string, ConfigSchemaEntry>;

/**
 * Infer the parsed TypeScript type from a ConfigType string.
 */
export type InferConfigType<T extends ConfigType | undefined> = T extends "int"
  ? number
  : T extends "float"
    ? number
    : T extends "bool"
      ? boolean
      : T extends "array"
        ? string[]
        : T extends "json"
          ? unknown
          : string;

/**
 * Infer the parsed values object type from a ConfigSchema.
 */
export type InferConfigValues<S extends ConfigSchema> = {
  [K in keyof S]: InferConfigType<S[K]["type"]>;
};

/**
 * Options for ConfigModule.forRoot()
 */
export interface ConfigModuleOptions {
  /** Config schema created with defineConfig() */
  schema: ConfigSchema;

  /** Path to .env file. If omitted, reads from Bun.env / process.env directly. */
  envPath?: string;

  /** Whether to validate all required fields at startup. Defaults to true. */
  validate?: boolean;
}

/**
 * Options for ConfigModule.forRootAsync()
 */
export interface ConfigModuleAsyncOptions extends AsyncPackOptions<ConfigModuleOptions> {}
