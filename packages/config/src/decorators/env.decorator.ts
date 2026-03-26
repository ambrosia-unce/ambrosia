/**
 * @Env() property decorator — injects a single config value by key.
 *
 * Stores metadata that is resolved when the class is instantiated by the DI container.
 * The actual value comes from ConfigService at resolution time.
 *
 * @example
 * ```ts
 * @Injectable()
 * class AppService {
 *   @Env('port') port!: number;
 *   @Env('debug') debug!: boolean;
 * }
 * ```
 */

import "reflect-metadata";

const ENV_METADATA_KEY = Symbol("ambrosia:config:env");

/**
 * Metadata stored by @Env() decorator.
 */
export interface EnvMetadata {
  propertyKey: string | symbol;
  configKey: string;
}

/**
 * Property decorator that marks a property for config value injection.
 *
 * @param configKey - The config schema key to inject (e.g. 'port', 'debug')
 * @returns A property decorator
 */
export function Env(configKey: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: EnvMetadata[] =
      Reflect.getOwnMetadata(ENV_METADATA_KEY, target.constructor) ?? [];
    existing.push({ propertyKey, configKey });
    Reflect.defineMetadata(ENV_METADATA_KEY, existing, target.constructor);
  };
}

/**
 * Get all @Env() metadata for a class.
 *
 * @param target - The class constructor
 * @returns Array of env metadata entries
 */
export function getEnvMetadata(target: Function): EnvMetadata[] {
  return Reflect.getOwnMetadata(ENV_METADATA_KEY, target) ?? [];
}
