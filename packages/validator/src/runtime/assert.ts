/**
 * assert<T>() - Throws ValidationError if validation fails
 *
 * This function is replaced by the validator plugin at compile-time with
 * optimized inline validation code generated from the TypeScript type T.
 */

import { ValidationError } from "../errors/index.ts";
import { validate } from "./validate.ts";

/**
 * Validates data against type T and returns typed data or throws.
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
 * try {
 *   const user = assert<User>(data);
 *   // user is typed as User and validated
 *   console.log(user.name);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error(error.errors);
 *   }
 * }
 * ```
 *
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 */
export function assert<T>(data: unknown): T {
  // The plugin will replace this with optimized inline code
  const result = validate<T>(data);

  if (!result.success) {
    throw ValidationError.fromDetails(result.errors);
  }

  return result.data;
}
