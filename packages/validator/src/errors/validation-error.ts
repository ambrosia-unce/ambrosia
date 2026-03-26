/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  /**
   * Path to the invalid field (e.g., "user.email", "items[0].name")
   */
  path: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Invalid value that caused the error
   */
  value?: unknown;

  /**
   * Expected type or constraint
   */
  expected?: string;
}

/**
 * Validation error thrown when validation fails
 */
export class ValidationError extends Error {
  /**
   * Array of validation error details
   */
  public readonly errors: ValidationErrorDetail[];

  /**
   * HTTP status code (422 Unprocessable Entity by default)
   */
  public readonly statusCode: number = 422;

  constructor(message: string, errors: ValidationErrorDetail[] = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;

    // Maintains proper stack trace for where error was thrown (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Create ValidationError from a single error detail
   */
  static fromDetail(detail: ValidationErrorDetail): ValidationError {
    return new ValidationError(detail.message, [detail]);
  }

  /**
   * Create ValidationError from multiple error details
   */
  static fromDetails(details: ValidationErrorDetail[]): ValidationError {
    const message =
      details.length === 1 ? details[0].message : `Validation failed with ${details.length} errors`;

    return new ValidationError(message, details);
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors,
    };
  }
}
