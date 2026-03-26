/**
 * @Config() class decorator — auto-populates all @Env() properties on a class.
 *
 * When used with @Injectable(), this decorator hooks into the DI resolution
 * to automatically populate @Env()-decorated properties with config values.
 *
 * @example
 * ```ts
 * @Config()
 * @Injectable()
 * class DatabaseConfig {
 *   @Env('dbHost') host!: string;
 *   @Env('dbPort') port!: number;
 *   @Env('dbName') name!: string;
 * }
 * ```
 */

import "reflect-metadata";

const CONFIG_CLASS_KEY = Symbol("ambrosia:config:class");

/**
 * Class decorator that marks a class for automatic config property injection.
 * All @Env() properties will be populated from ConfigService during resolution.
 */
export function Config(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(CONFIG_CLASS_KEY, true, target);
  };
}

/**
 * Check if a class is decorated with @Config().
 */
export function isConfigClass(target: Function): boolean {
  return Reflect.getOwnMetadata(CONFIG_CLASS_KEY, target) === true;
}
