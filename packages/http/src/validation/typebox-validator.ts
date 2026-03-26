/**
 * TypeBox validator wrapper
 */

import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { ValidationError, type ValidationErrorDetail } from "./validation-error.ts";

/**
 * TypeBoxValidator
 *
 * Wrapper around TypeBox Value API for validation
 */
export class TypeBoxValidator {
  /**
   * Validate value against TypeBox schema
   *
   * @param schema - TypeBox schema
   * @param value - Value to validate
   * @returns Validated value (typed)
   * @throws ValidationError if validation fails
   */
  static validate<T>(schema: TSchema, value: unknown): T {
    const errors = [...Value.Errors(schema, value)];

    if (errors.length > 0) {
      // Map TypeBox errors to ValidationErrorDetail format
      const validationErrors: ValidationErrorDetail[] = errors.map((err) => ({
        property: err.path,
        constraints: {
          [err.type]: err.message,
        },
        value: err.value,
      }));

      throw new ValidationError("Validation failed", validationErrors);
    }

    return value as T;
  }

  /**
   * Check if value matches schema (non-throwing)
   *
   * @param schema - TypeBox schema
   * @param value - Value to check
   * @returns True if valid, false otherwise
   */
  static check(schema: TSchema, value: unknown): boolean {
    return Value.Check(schema, value);
  }

  /**
   * Get validation errors without throwing
   *
   * @param schema - TypeBox schema
   * @param value - Value to validate
   * @returns Array of validation error details, empty if valid
   */
  static getErrors(schema: TSchema, value: unknown): ValidationErrorDetail[] {
    const errors = [...Value.Errors(schema, value)];

    return errors.map((err) => ({
      property: err.path,
      constraints: {
        [err.type]: err.message,
      },
      value: err.value,
    }));
  }
}
