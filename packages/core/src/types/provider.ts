/**
 * Provider type definitions and type guards
 *
 * Providers define how dependencies are created and managed.
 * There are four types of providers:
 * - ClassProvider: Instantiates a class with constructor injection
 * - ValueProvider: Provides a pre-created value or constant
 * - FactoryProvider: Uses a factory function to create instances
 * - ExistingProvider: Aliases one token to another
 */

import { InvalidProviderError } from "../container";
import type { Scope } from "../scope";
import type { Constructor, Factory, Token } from "./common.ts";

/**
 * Base provider interface
 * All providers must have a token and optional scope
 */
export interface BaseProvider<T = any> {
  /** The token used to identify this provider */
  token: Token<T>;
  /** Lifecycle scope (defaults to SINGLETON). Can be a built-in Scope or a custom scope string. */
  scope?: Scope | string;
}

/**
 * Class Provider - Instantiates a class with constructor injection
 *
 * @example
 * ```typescript
 * {
 *   token: UserService,
 *   useClass: UserService,
 *   scope: Scope.SINGLETON
 * }
 * ```
 */
export interface ClassProvider<T = any> extends BaseProvider<T> {
  /** The class to instantiate */
  useClass: Constructor<T>;
}

/**
 * Value Provider - Provides a constant value
 *
 * @example
 * ```typescript
 * {
 *   token: CONFIG_TOKEN,
 *   useValue: { apiUrl: 'https://api.example.com', port: 3000 }
 * }
 * ```
 */
export interface ValueProvider<T = any> extends BaseProvider<T> {
  /** The constant value to provide */
  useValue: T;
}

/**
 * Factory Provider - Uses a factory function to create instances
 * The factory receives the container for resolving dependencies
 *
 * @example
 * ```typescript
 * {
 *   token: Logger,
 *   useFactory: (container) => {
 *     const config = container.resolve(CONFIG_TOKEN);
 *     return new Logger(config.logLevel);
 *   },
 *   deps: [CONFIG_TOKEN], // Optional: explicit dependencies
 *   scope: Scope.SINGLETON
 * }
 * ```
 */
export interface FactoryProvider<T = any> extends BaseProvider<T> {
  /** Factory function that creates the instance */
  useFactory: Factory<T>;
  /** Optional explicit dependencies to resolve before calling factory */
  deps?: Token[];
}

/**
 * Existing Provider - Creates an alias to another token
 *
 * @example
 * ```typescript
 * {
 *   token: ILogger,
 *   useExisting: ConsoleLogger
 * }
 * ```
 */
export interface ExistingProvider<T = any> extends BaseProvider<T> {
  /** The existing token to resolve */
  useExisting: Token<T>;
}

/**
 * Union type of all provider types
 */
export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

// ==================== Type Guards ====================

/**
 * Check if a provider is a ClassProvider
 */
export function isClassProvider(provider: Provider): provider is ClassProvider {
  return "useClass" in provider;
}

/**
 * Check if a provider is a ValueProvider
 */
export function isValueProvider(provider: Provider): provider is ValueProvider {
  return "useValue" in provider;
}

/**
 * Check if a provider is a FactoryProvider
 */
export function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return "useFactory" in provider;
}

/**
 * Check if a provider is an ExistingProvider
 */
export function isExistingProvider(provider: Provider): provider is ExistingProvider {
  return "useExisting" in provider;
}

/**
 * Validate that a provider is well-formed
 * @throws {InvalidProviderError} if the provider is invalid
 */
export function validateProvider(provider: Provider): void {
  if (!provider.token) {
    throw new InvalidProviderError("Provider must have a token");
  }

  // Validate token type
  if (typeof provider.token !== "function" && typeof provider.token !== "object") {
    throw new InvalidProviderError(
      `Invalid token type: expected function or object, got ${typeof provider.token}`,
    );
  }

  // Validate scope if provided (must be a non-empty string)
  if (provider.scope !== undefined && typeof provider.scope !== "string") {
    throw new InvalidProviderError(
      `Invalid scope type: expected string, got ${typeof provider.scope}`,
    );
  }

  // Check that exactly one of the provider types is set
  const types = [
    isClassProvider(provider),
    isValueProvider(provider),
    isFactoryProvider(provider),
    isExistingProvider(provider),
  ];

  const typeCount = types.filter(Boolean).length;

  if (typeCount === 0) {
    throw new InvalidProviderError(
      "Provider must have one of: useClass, useValue, useFactory, or useExisting",
    );
  }

  if (typeCount > 1) {
    throw new InvalidProviderError(
      "Provider can only have one of: useClass, useValue, useFactory, or useExisting",
    );
  }

  // Validate ClassProvider
  if (isClassProvider(provider)) {
    if (typeof provider.useClass !== "function") {
      throw new InvalidProviderError("ClassProvider.useClass must be a constructor function");
    }
    // Arrow functions and bound functions have no prototype — they can't be used with `new`
    if (provider.useClass.prototype === undefined) {
      throw new InvalidProviderError(
        "ClassProvider.useClass must be a class or constructor function, not an arrow/bound function",
      );
    }
  }

  // Validate FactoryProvider
  if (isFactoryProvider(provider)) {
    if (typeof provider.useFactory !== "function") {
      throw new InvalidProviderError("FactoryProvider.useFactory must be a function");
    }
  }

  // Validate ExistingProvider
  if (isExistingProvider(provider)) {
    if (!provider.useExisting) {
      throw new InvalidProviderError("ExistingProvider.useExisting must be a valid token");
    }
  }
}
