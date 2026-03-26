/**
 * is<T>() - Type guard that validates and narrows type
 *
 * This function is replaced by the validator plugin at compile-time with
 * optimized inline validation code generated from the TypeScript type T.
 */

import { validate } from "./validate.ts";

/**
 * Type guard that validates data against type T.
 *
 * **Plugin Required:** This function requires the @ambrosia-unce/validator plugin
 * to be active. Add `preload = ["@ambrosia-unce/validator/preload"]` to bunfig.toml.
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * if (is<User>(data)) {
 *   // data is narrowed to User type here
 *   console.log(data.name);
 * } else {
 *   console.error('Invalid user data');
 * }
 * ```
 *
 * @param data - Data to validate
 * @returns true if data matches type T, false otherwise
 */
export function is<T>(data: unknown): data is T {
  // The plugin will replace this with optimized inline code
  try {
    const result = validate<T>(data);
    return result.success;
  } catch {
    return false;
  }
}
