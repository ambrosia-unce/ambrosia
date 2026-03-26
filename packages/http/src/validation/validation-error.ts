/**
 * Validation error class
 */

import { UnprocessableEntityException } from "../exceptions/built-in-exceptions.ts";

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  /**
   * Property path (e.g., 'email', 'user.name')
   */
  property: string;

  /**
   * Validation constraints that failed
   */
  constraints: Record<string, string>;

  /**
   * Value that failed validation
   */
  value?: any;
}

/**
 * ValidationError
 *
 * Extends UnprocessableEntityException (422)
 * Contains detailed validation errors
 */
export class ValidationError extends UnprocessableEntityException {
  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[],
  ) {
    super(message, "Validation Failed");
    this.name = "ValidationError";
  }

  /**
   * Get validation errors
   */
  getErrors(): ValidationErrorDetail[] {
    return this.errors;
  }

  /**
   * Override getResponse to include validation errors
   */
  getResponse() {
    return {
      statusCode: this.status,
      message: this.message,
      error: this.getError(),
      errors: this.errors,
    };
  }
}
