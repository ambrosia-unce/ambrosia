/**
 * AmbrosiaError — Base error class for the Ambrosia framework.
 *
 * Provides structured, actionable error messages with:
 * - Error codes (e.g. AMB001) for quick lookup
 * - Human-readable messages explaining what went wrong
 * - Hints suggesting how to fix the issue
 * - Contextual data for debugging
 * - Docs links for detailed explanations
 */
export class AmbrosiaError extends Error {
  constructor(
    /** Unique error code, e.g. 'AMB001' */
    public readonly code: string,
    /** Human-readable error message */
    message: string,
    /** Actionable hint on how to fix this error */
    public readonly hint?: string,
    /** Additional context for debugging */
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AmbrosiaError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Generate a documentation URL for this error code */
  get docsUrl(): string {
    return `https://ambrosia.dev/docs/core/errors/${this.code}`;
  }
}
