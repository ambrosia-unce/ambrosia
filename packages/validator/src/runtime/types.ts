/**
 * Runtime validation types
 */

import type { ValidationErrorDetail } from "../errors/validation-error.ts";

/**
 * Successful validation result
 */
export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

/**
 * Failed validation result
 */
export interface ValidationFailure {
  success: false;
  errors: ValidationErrorDetail[];
}

/**
 * Validation result (discriminated union)
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Type guard for successful validation
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>,
): result is ValidationSuccess<T> {
  return result.success === true;
}

/**
 * Type guard for failed validation
 */
export function isValidationFailure<T>(result: ValidationResult<T>): result is ValidationFailure {
  return result.success === false;
}
