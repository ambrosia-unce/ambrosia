/**
 * validate<T>() - Returns ValidationResult with success/failure status
 *
 * This function is replaced by the validator plugin at compile-time with
 * optimized inline validation code generated from the TypeScript type T.
 *
 * If the plugin is not active, this fallback implementation is used.
 */

import { ValidationError, type ValidationErrorDetail } from "../errors/index.ts";
import type { ValidationResult } from "./types.ts";

/**
 * Validates data against type T and returns a result object.
 *
 * **Plugin Required:** This function requires the @ambrosia-unce/validator plugin
 * to be active. Add `preload = ["@ambrosia-unce/validator/preload"]` to bunfig.toml.
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * const result = validate<User>(data);
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 *
 * @param data - Data to validate
 * @returns Validation result with success status and data/errors
 */
export function validate<T>(data: unknown): ValidationResult<T> {
  // This is a fallback implementation when plugin is not active.
  // The plugin will replace this entire function body with generated code.

  // Plugin not active — always throw to prevent silent data acceptance.
  // Silently passing data through in production is dangerous and masks
  // configuration errors. Better to fail loud than to accept invalid data.
  throw new Error(
    "@ambrosia-unce/validator: Plugin not active. Cannot perform validation. " +
      "Add 'preload = [\"@ambrosia-unce/validator/preload\"]' to bunfig.toml to enable " +
      "compile-time validation.",
  );
}

/**
 * Internal marker for plugin detection.
 * The plugin looks for this symbol to identify validate() calls.
 * @internal
 */
export const __AMBROSIA_VALIDATOR_MARKER__ = Symbol("ambrosia-validator");
