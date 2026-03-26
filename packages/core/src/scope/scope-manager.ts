/**
 * Scope Manager - Manages cached instances for different scopes
 *
 * Handles caching logic for:
 * - Singleton scope (permanent cache)
 * - Request scope (AsyncLocalStorage cache)
 * - Transient scope (no caching)
 */

import { hasOnDestroy } from "../interfaces/lifecycle.ts";
import type { ScopeHandler } from "../plugins/types.ts";
import type { Token } from "../types";
import { globalLogger } from "../utils/logger.ts";
import { RequestScopeStorage } from "./request-scope-storage.ts";
import { Scope } from "./types.ts";

/**
 * Scope Manager class
 * Coordinates instance caching across different lifecycle scopes
 */
export class ScopeManager {
  /**
   * Singleton cache - persists for the lifetime of the container
   */
  private singletonCache = new Map<Token, any>();

  /**
   * Request scope storage - AsyncLocalStorage-based cache
   */
  private readonly requestStorage: RequestScopeStorage;

  /**
   * Custom scope handlers registered via plugins
   */
  private customScopes = new Map<string, ScopeHandler>();

  /**
   * Instances with OnDestroy hooks, tracked in creation order (LIFO on destroy)
   */
  private destroyOrder: Array<{ token: Token; instance: any }> = [];

  constructor() {
    this.requestStorage = new RequestScopeStorage();
  }

  /**
   * Register a custom scope handler.
   * Custom scopes allow plugins to define their own caching strategies.
   *
   * @param name Scope name (must not conflict with built-in scopes)
   * @param handler ScopeHandler implementation
   */
  registerCustomScope(name: string, handler: ScopeHandler): void {
    const builtIn = Object.values(Scope) as string[];
    if (builtIn.includes(name)) {
      throw new Error(`Cannot register custom scope "${name}": conflicts with built-in scope`);
    }
    this.customScopes.set(name, handler);
  }

  /**
   * Check if a custom scope is registered
   */
  hasCustomScope(name: string): boolean {
    return this.customScopes.has(name);
  }

  /**
   * Get a cached instance for the given token and scope
   *
   * @param token The token to look up
   * @param scope The scope to check
   * @returns The cached instance or undefined if not found/not applicable
   */
  get(token: Token, scope: Scope | string): any | undefined {
    // Fast path: 95% of cases are SINGLETON
    // Avoid switch statement overhead for the most common case
    if (scope === Scope.SINGLETON) {
      return this.singletonCache.get(token);
    }

    // Transient instances are never cached
    if (scope === Scope.TRANSIENT) {
      return undefined;
    }

    // REQUEST scope (get() returns undefined when no active scope)
    if (scope === Scope.REQUEST) {
      return this.requestStorage.get(token);
    }

    // Custom scope
    const handler = this.customScopes.get(scope);
    return handler?.get(token);
  }

  /**
   * Store an instance in the appropriate cache for its scope
   *
   * @param token The token to associate with the instance
   * @param scope The scope to cache in
   * @param instance The instance to cache
   */
  set(token: Token, scope: Scope | string, instance: any): void {
    switch (scope) {
      case Scope.SINGLETON:
        this.singletonCache.set(token, instance);
        break;

      case Scope.REQUEST:
        this.requestStorage.set(token, instance);
        break;

      case Scope.TRANSIENT:
        // Transient instances are never cached
        break;

      default: {
        // Custom scope
        const handler = this.customScopes.get(scope);
        handler?.set(token, instance);
        break;
      }
    }
  }

  /**
   * Check if an instance exists in the cache for the given scope
   *
   * @param token The token to check
   * @param scope The scope to check
   * @returns true if a cached instance exists
   */
  has(token: Token, scope: Scope | string): boolean {
    switch (scope) {
      case Scope.SINGLETON:
        return this.singletonCache.has(token);

      case Scope.REQUEST:
        return this.requestStorage.has(token);

      case Scope.TRANSIENT:
        return false;

      default: {
        const handler = this.customScopes.get(scope);
        return handler?.has(token) ?? false;
      }
    }
  }

  /**
   * Delete a specific cached instance by token and scope
   *
   * @param token The token to delete
   * @param scope The scope to delete from
   * @returns true if the instance was deleted
   */
  delete(token: Token, scope: Scope | string): boolean {
    switch (scope) {
      case Scope.SINGLETON:
        return this.singletonCache.delete(token);

      case Scope.REQUEST:
        if (!this.requestStorage.hasActiveScope()) {
          return false;
        }
        return this.requestStorage.delete(token);

      case Scope.TRANSIENT:
        return false;

      default: {
        // Custom scopes don't support delete
        return false;
      }
    }
  }

  /**
   * Clear all cached instances for a specific scope
   *
   * @param scope The scope to clear
   */
  clearScope(scope: Scope | string): void {
    switch (scope) {
      case Scope.SINGLETON:
        this.singletonCache.clear();
        break;

      case Scope.REQUEST:
        this.requestStorage.clear();
        break;

      case Scope.TRANSIENT:
        // Nothing to clear for transient scope
        break;

      default: {
        const handler = this.customScopes.get(scope);
        handler?.clear();
        break;
      }
    }
  }

  /**
   * Clear all cached instances across all scopes
   */
  clearAll(): void {
    this.singletonCache.clear();
    this.requestStorage.clear();
    this.destroyOrder = [];
  }

  /**
   * Track an instance with OnDestroy for later cleanup.
   */
  trackForDestroy(token: Token, instance: any): void {
    this.destroyOrder.push({ token, instance });
  }

  /**
   * Execute onDestroy on all tracked instances in reverse order (LIFO),
   * then clear all caches.
   */
  async destroyAll(): Promise<Error[]> {
    const errors: Error[] = [];
    for (let i = this.destroyOrder.length - 1; i >= 0; i--) {
      const entry = this.destroyOrder[i]!;
      try {
        await entry.instance.onDestroy();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        globalLogger.error(`onDestroy failed for ${String(entry.token)}: ${err.message}`);
        errors.push(err);
      }
    }
    this.destroyOrder = [];
    this.singletonCache.clear();
    this.requestStorage.clear();
    return errors;
  }

  /**
   * Get the request scope storage for direct access
   * Useful for wrapping code in request scope: requestStorage.run(() => {})
   */
  getRequestStorage(): RequestScopeStorage {
    return this.requestStorage;
  }

  /**
   * Get the number of cached singleton instances
   */
  getSingletonCacheSize(): number {
    return this.singletonCache.size;
  }

  /**
   * Get the number of cached request-scoped instances (in current context)
   */
  getRequestCacheSize(): number {
    return this.requestStorage.size();
  }

  /**
   * Get statistics about cached instances
   *
   * @returns Object with cache statistics
   */
  getStats(): {
    singletonCount: number;
    requestCount: number;
  } {
    return {
      singletonCount: this.getSingletonCacheSize(),
      requestCount: this.getRequestCacheSize(),
    };
  }
}
