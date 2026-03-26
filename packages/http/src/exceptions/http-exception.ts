/**
 * Base HTTP Exception class
 */

/**
 * HttpException - base exception for HTTP errors
 *
 * All HTTP exceptions should extend this class
 */
export class HttpException extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly error?: string,
  ) {
    super(message);
    this.name = "HttpException";
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get HTTP status code
   */
  getStatus(): number {
    return this.status;
  }

  /**
   * Get error message
   */
  getMessage(): string {
    return this.message;
  }

  /**
   * Get error type/name
   */
  getError(): string {
    return this.error || this.name;
  }

  /**
   * Get response object for JSON serialization
   */
  getResponse(): {
    statusCode: number;
    message: string;
    error: string;
  } {
    return {
      statusCode: this.status,
      message: this.message,
      error: this.getError(),
    };
  }
}
