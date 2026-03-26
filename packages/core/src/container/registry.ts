/**
 * Registry - Global singleton registry for auto-discovered providers
 *
 * The Registry stores providers registered by decorators (especially @Injectable).
 * It enables zero-config dependency injection where classes are automatically
 * registered when decorated.
 */

import type { Abstract, Constructor, Provider, Token } from "../types";
import { globalLogger } from "../utils/logger.ts";

/**
 * Registry class - Singleton pattern
 * Stores all providers registered via decorators
 */
export class Registry {
  private static instance: Registry | null = null;

  /**
   * Map of token -> provider
   */
  private providers = new Map<Token, Provider>();

  /**
   * Map of abstract class -> concrete implementation
   * Used for @Implements decorator
   */
  private implementations = new Map<Abstract, Constructor>();

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {}

  /**
   * Get the singleton Registry instance
   */
  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Register a provider
   *
   * @param provider The provider to register
   * @throws {Error} if a provider with the same token is already registered
   */
  registerProvider(provider: Provider): void {
    const { token } = provider;

    if (this.providers.has(token)) {
      // Allow re-registration with warning (useful for hot reload)
      globalLogger.warn(
        `Provider for token ${this.tokenToString(token)} is being re-registered. ` +
          `This will overwrite the previous registration.`,
      );
    }

    this.providers.set(token, provider);
  }

  /**
   * Register a provider silently (no warning on duplicate)
   * Used internally when we want to allow overwrites
   */
  registerProviderSilent(provider: Provider): void {
    this.providers.set(provider.token, provider);
  }

  /**
   * Get a provider by token
   *
   * @param token The token to look up
   * @returns The provider or undefined if not found
   */
  getProvider(token: Token): Provider | undefined {
    // First check direct token lookup
    const provider = this.providers.get(token);

    if (provider) {
      return provider;
    }

    // Check if this is an abstract class with an implementation
    const implementation = this.implementations.get(token as Abstract);
    if (implementation) {
      return this.providers.get(implementation);
    }

    return undefined;
  }

  /**
   * Check if a provider exists for a token
   *
   * @param token The token to check
   * @returns true if a provider is registered
   */
  hasProvider(token: Token): boolean {
    return this.providers.has(token) || this.implementations.has(token as Abstract);
  }

  /**
   * Get all registered providers
   *
   * @returns Array of all providers
   */
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all registered tokens
   *
   * @returns Array of all tokens
   */
  getAllTokens(): Token[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Register an abstract class implementation
   * Used by @Implements decorator
   *
   * @param abstractToken The abstract class
   * @param implementation The concrete implementation
   */
  registerImplementation(abstractToken: Abstract, implementation: Constructor): void {
    this.implementations.set(abstractToken, implementation);
  }

  /**
   * Get the implementation for an abstract class
   *
   * @param abstractToken The abstract class
   * @returns The concrete implementation or undefined
   */
  getImplementation(abstractToken: Abstract): Constructor | undefined {
    return this.implementations.get(abstractToken);
  }

  /**
   * Clear all registered providers (useful for testing)
   */
  clear(): void {
    this.providers.clear();
    this.implementations.clear();
  }

  /**
   * Remove a specific provider
   *
   * @param token The token to remove
   * @returns true if the provider was removed
   */
  removeProvider(token: Token): boolean {
    return this.providers.delete(token);
  }

  /**
   * Get the number of registered providers
   */
  get size(): number {
    return this.providers.size;
  }

  /**
   * Auto-register all providers to a container
   * This is called when a container is created to populate it with decorated classes
   *
   * @param registerFn Function to register providers (from container)
   */
  autoRegisterTo(registerFn: (provider: Provider) => void): void {
    for (const provider of this.providers.values()) {
      registerFn(provider);
    }
  }

  /**
   * Helper to convert token to string for logging
   */
  private tokenToString(token: Token): string {
    if (typeof token === "function") {
      return token.name || "<anonymous>";
    }
    return String(token);
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    if (Registry.instance) {
      Registry.instance.clear();
      Registry.instance = null;
    }
  }
}

/**
 * Convenience function to get the global registry
 */
export function getRegistry(): Registry {
  return Registry.getInstance();
}
