/**
 * Custom error classes for the DI container
 *
 * These errors provide detailed, actionable messages to help
 * developers debug dependency injection issues.
 */

import type { Token } from "../types";
import { tokenToString } from "../utils";

/**
 * Format a resolution path for display
 */
function formatResolutionPath(path: Token[]): string {
  if (path.length === 0) return "";
  return `\n  Resolution path: ${path.map(tokenToString).join(" → ")}`;
}

/**
 * Base error class for all DI-related errors
 */
export class DIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DIError";
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when a circular dependency is detected
 *
 * Example: A depends on B, B depends on C, C depends on A
 */
export class CircularDependencyError extends DIError {
  constructor(public readonly chain: Token[]) {
    const chainStr = chain.map(tokenToString).join(" → ");
    super(
      `Circular dependency detected:\n  ${chainStr}\n\n` +
        `Possible solutions:\n` +
        `  1. Use factory provider with lazy evaluation\n` +
        `  2. Use @Autowired for property injection (breaks the cycle)\n` +
        `  3. Refactor to remove the circular reference`,
    );
    this.name = "CircularDependencyError";
  }
}

/**
 * Thrown when no provider is found for a requested token
 */
export class ProviderNotFoundError extends DIError {
  constructor(
    public readonly token: Token,
    public readonly resolutionPath?: Token[],
  ) {
    super(
      `No provider found for ${tokenToString(token)}` +
        (resolutionPath?.length ? formatResolutionPath(resolutionPath) : "") +
        `\n\n` +
        `Possible solutions:\n` +
        `  1. Register the provider: container.register(...)\n` +
        `  2. Add @Injectable() decorator to the class\n` +
        `  3. Use @Optional() if the dependency is optional\n` +
        `  4. Check that the token matches the registered provider`,
    );
    this.name = "ProviderNotFoundError";
  }
}

/**
 * Thrown when a provider configuration is invalid
 */
export class InvalidProviderError extends DIError {
  constructor(
    message: string,
    public readonly token?: Token,
  ) {
    super(
      token
        ? `Invalid provider (token: ${tokenToString(token)}): ${message}`
        : `Invalid provider: ${message}`,
    );
    this.name = "InvalidProviderError";
  }
}

/**
 * Thrown when dependency resolution fails
 */
export class ResolutionError extends DIError {
  constructor(
    public readonly token: Token,
    cause: Error,
    public readonly resolutionPath?: Token[],
  ) {
    super(
      `Failed to resolve ${tokenToString(token)}` +
        (resolutionPath?.length ? formatResolutionPath(resolutionPath) : "") +
        `\n` +
        `Cause: ${cause.message}\n\n` +
        `This usually means:\n` +
        `  1. A dependency's constructor threw an error\n` +
        `  2. A factory function failed\n` +
        `  3. A required constructor parameter is missing`,
    );
    this.name = "ResolutionError";
    this.cause = cause;
  }
}

/**
 * Thrown when request scope operations are attempted without an active scope
 */
export class NoRequestScopeError extends DIError {
  constructor(public readonly token?: Token) {
    super(
      `No request scope active` +
        (token ? ` for ${tokenToString(token)}` : "") +
        `\n\n` +
        `Request-scoped providers can only be resolved within a request context.\n` +
        `Wrap your code with:\n` +
        `  container.requestStorage.run(() => {\n` +
        `    // Your code here\n` +
        `  })`,
    );
    this.name = "NoRequestScopeError";
  }
}

/**
 * Thrown when a class is not decorated with @Injectable
 */
export class NotInjectableError extends DIError {
  constructor(public readonly target: Function) {
    super(
      `Class ${target.name} is not injectable\n\n` +
        `Add the @Injectable() decorator:\n` +
        `  @Injectable()\n` +
        `  class ${target.name} { ... }`,
    );
    this.name = "NotInjectableError";
  }
}

/**
 * Thrown when a constructor or factory throws during instantiation
 */
export class InstantiationError extends DIError {
  constructor(
    public readonly target: Function | string,
    cause: Error,
    public readonly resolutionPath?: Token[],
  ) {
    const name = typeof target === "string" ? target : target.name;
    super(
      `Failed to instantiate ${name}` +
        (resolutionPath?.length ? formatResolutionPath(resolutionPath) : "") +
        `\n` +
        `Cause: ${cause.message}`,
    );
    this.name = "InstantiationError";
    this.cause = cause;
  }
}

/**
 * Thrown when an async operation (factory or onInit) is used in sync resolve
 */
export class AsyncInSyncError extends DIError {
  constructor(
    public readonly token: Token,
    public readonly operation: "factory" | "onInit",
  ) {
    const detail =
      operation === "factory"
        ? "Async factories must be resolved with resolveAsync(). Use container.resolveAsync() instead of container.resolve()"
        : `${tokenToString(token)}.onInit() returned a Promise. Use container.resolveAsync() for async lifecycle hooks.`;
    super(detail);
    this.name = "AsyncInSyncError";
  }
}

/**
 * Thrown when @Autowired property injection fails
 */
export class PropertyInjectionError extends DIError {
  constructor(
    public readonly target: Function,
    public readonly propertyKey: string | symbol,
    cause: Error,
  ) {
    super(
      `Failed to inject property ${String(propertyKey)} on ${target.name}\n` +
        `Cause: ${cause.message}`,
    );
    this.name = "PropertyInjectionError";
    this.cause = cause;
  }
}

/**
 * Thrown when type metadata is missing for a parameter or property
 */
export class MetadataError extends DIError {
  constructor(
    public readonly target: Function,
    public readonly detail: string,
  ) {
    super(`${target.name}: ${detail}`);
    this.name = "MetadataError";
  }
}
