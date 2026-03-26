/**
 * ConfigModule — Pack-based module registration for @ambrosia-unce/config.
 *
 * Provides forRoot() for synchronous config loading and
 * forRootAsync() for async/dynamic config loading.
 *
 * All env vars are parsed ONCE at bootstrap into a frozen Map.
 */

import { createAsyncProvider, definePack, type PackDefinition } from "@ambrosia-unce/core";
import { ConfigService } from "./config.service.ts";
import { ConfigMissingError, parseValue } from "./parsers.ts";
import { CONFIG_SCHEMA, CONFIG_VALUES } from "./tokens.ts";
import type { ConfigModuleAsyncOptions, ConfigModuleOptions, ConfigSchema } from "./types.ts";

/**
 * Parse all env vars from a schema into a frozen Map<string, unknown>.
 * This is the core parsing logic — runs ONCE at startup.
 *
 * @param schema - Config schema definition
 * @param envSource - The environment source (defaults to process.env)
 * @param validate - Whether to validate required fields
 * @returns A frozen Map of parsed values
 */
function buildConfigMap(
  schema: ConfigSchema,
  envSource: Record<string, string | undefined>,
  validate: boolean,
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const errors: string[] = [];

  for (const [key, entry] of Object.entries(schema)) {
    const rawValue = envSource[entry.env];
    const type = entry.type ?? "string";

    if (rawValue !== undefined && rawValue !== "") {
      // Parse the raw value according to its type
      try {
        map.set(key, parseValue(rawValue, type, key, entry.separator));
      } catch (err) {
        if (validate) {
          errors.push((err as Error).message);
        } else {
          // Use default if available, otherwise set undefined
          if (entry.default !== undefined) {
            map.set(key, entry.default);
          }
        }
      }
    } else if (entry.default !== undefined) {
      // No env value, use the default
      map.set(key, entry.default);
    } else if (entry.required !== false && validate) {
      // Required field with no value and no default
      errors.push(new ConfigMissingError(key, entry.env).message);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[Config] Configuration validation failed with ${errors.length} error(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return map;
}

/**
 * Load environment variables from a .env file path into a record.
 * Uses Bun's native file reading for performance.
 */
function loadEnvFile(envPath: string): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};

  try {
    // Synchronous read — we need this at bootstrap before the event loop
    const content = require("node:fs").readFileSync(envPath, "utf-8") as string;

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  } catch {
    // File not found is not an error — we fall back to process.env
  }

  return env;
}

/**
 * Get the merged env source: .env file values overlaid on process.env / Bun.env.
 */
function getEnvSource(envPath?: string): Record<string, string | undefined> {
  // Start with process.env as the base
  const base: Record<string, string | undefined> = { ...process.env };

  if (envPath) {
    const fileEnv = loadEnvFile(envPath);
    // File values take precedence over process.env
    for (const [key, value] of Object.entries(fileEnv)) {
      if (value !== undefined) {
        base[key] = value;
      }
    }
  }

  return base;
}

/**
 * Define a config schema with type safety.
 *
 * @param schema - A record of config key → schema entry definitions
 * @returns The same schema object (for type inference)
 *
 * @example
 * ```ts
 * const AppConfig = defineConfig({
 *   port: { env: 'PORT', type: 'int', default: 3000 },
 *   debug: { env: 'DEBUG', type: 'bool', default: false },
 *   dbHosts: { env: 'DB_HOSTS', type: 'array', separator: ',' },
 *   redis: { env: 'REDIS_CONFIG', type: 'json' },
 *   secret: { env: 'JWT_SECRET', required: true },
 * });
 * ```
 */
export function defineConfig<S extends ConfigSchema>(schema: S): S {
  return schema;
}

/**
 * ConfigModule — provides configuration as a pack for the Ambrosia DI system.
 *
 * @example
 * ```ts
 * const AppPack = definePack({
 *   imports: [
 *     ConfigModule.forRoot({
 *       schema: AppConfig,
 *       envPath: '.env',
 *       validate: true,
 *     }),
 *   ],
 * });
 * ```
 */
export class ConfigModule {
  /**
   * Register config synchronously.
   * Parses all env vars ONCE at module load time and freezes the result.
   *
   * @param options - Config module options
   * @returns A PackDefinition to use in imports
   */
  static forRoot(options: ConfigModuleOptions): PackDefinition {
    const { schema, envPath, validate = true } = options;
    const envSource = getEnvSource(envPath);
    const configMap = buildConfigMap(schema, envSource, validate);

    return definePack({
      meta: { name: "@ambrosia-unce/config" },
      providers: [
        { token: CONFIG_SCHEMA, useValue: schema },
        { token: CONFIG_VALUES, useValue: configMap },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_VALUES, CONFIG_SCHEMA],
    });
  }

  /**
   * Register config asynchronously.
   * Useful when config options depend on other services (e.g. secret managers).
   *
   * @param options - Async pack options producing ConfigModuleOptions
   * @returns A PackDefinition to use in imports
   */
  static forRootAsync(options: ConfigModuleAsyncOptions): PackDefinition {
    const configOptionsProvider = createAsyncProvider(CONFIG_SCHEMA, {
      useFactory: async (...args: unknown[]) => {
        const moduleOptions = (await options.useFactory(...args)) as ConfigModuleOptions;
        return moduleOptions.schema;
      },
      inject: options.inject,
    });

    const configValuesProvider = createAsyncProvider(CONFIG_VALUES, {
      useFactory: async (...args: unknown[]) => {
        const moduleOptions = (await options.useFactory(...args)) as ConfigModuleOptions;
        const { schema, envPath, validate = true } = moduleOptions;
        const envSource = getEnvSource(envPath);
        return buildConfigMap(schema, envSource, validate);
      },
      inject: options.inject,
    });

    return definePack({
      meta: { name: "@ambrosia-unce/config" },
      providers: [configOptionsProvider, configValuesProvider, ConfigService],
      exports: [ConfigService, CONFIG_VALUES, CONFIG_SCHEMA],
    });
  }
}
