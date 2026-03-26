/**
 * Request Scope Storage - AsyncLocalStorage wrapper for request-scoped instances
 *
 * Provides isolated storage for request-scoped dependencies using Node.js AsyncLocalStorage.
 * Each async context (e.g., HTTP request) gets its own isolated Map of instances.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { NoRequestScopeError } from "../container";
import type { Token } from "../types";

/**
 * Request Scope Storage class
 * Manages request-scoped dependency instances using AsyncLocalStorage
 */
export class RequestScopeStorage {
  private storage = new AsyncLocalStorage<Map<Token, any>>();

  /**
   * Run a function within a new request scope context
   *
   * @param callback Function to execute within the request scope
   * @returns The return value of the callback
   *
   * @example
   * ```typescript
   * requestStorage.run(() => {
   *   const ctx = container.resolve(RequestContext);
   *   ctx.userId = '123';
   *   handleRequest();
   * });
   * ```
   */
  run<T>(callback: () => T): T {
    return this.storage.run(new Map(), callback);
  }

  /**
   * Run an async function within a new request scope context
   *
   * @param callback Async function to execute within the request scope
   * @returns Promise resolving to the callback's return value
   *
   * @example
   * ```typescript
   * await requestStorage.runAsync(async () => {
   *   const ctx = container.resolve(RequestContext);
   *   await processRequest(ctx);
   * });
   * ```
   */
  async runAsync<T>(callback: () => Promise<T>): Promise<T> {
    return this.storage.run(new Map(), callback);
  }

  /**
   * Get an instance from the current request scope
   *
   * @param token The token to look up
   * @returns The cached instance or undefined if not found or no active scope
   */
  get(token: Token): any | undefined {
    const store = this.storage.getStore();
    if (!store) {
      return undefined;
    }
    return store.get(token);
  }

  /**
   * Store an instance in the current request scope
   *
   * @param token The token to associate with the instance
   * @param instance The instance to store
   * @throws {NoRequestScopeError} If called outside a request scope context
   */
  set(token: Token, instance: any): void {
    const store = this.storage.getStore();
    if (!store) {
      throw new NoRequestScopeError();
    }
    store.set(token, instance);
  }

  /**
   * Check if a token exists in the current request scope
   *
   * @param token The token to check
   * @returns true if the token has a cached instance, false if no active scope
   */
  has(token: Token): boolean {
    const store = this.storage.getStore();
    if (!store) {
      return false;
    }
    return store.has(token);
  }

  /**
   * Delete a cached instance from the current request scope
   *
   * @param token The token to delete
   * @returns true if the token was deleted, false if not found or no active scope
   */
  delete(token: Token): boolean {
    const store = this.storage.getStore();
    if (!store) {
      return false;
    }
    return store.delete(token);
  }

  /**
   * Clear all instances in the current request scope
   * Note: The scope is automatically cleared when exiting the run() context
   */
  clear(): void {
    const store = this.storage.getStore();
    store?.clear();
  }

  /**
   * Check if there's an active request scope
   *
   * @returns true if currently within a request scope context
   */
  hasActiveScope(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /**
   * Get the size of the current request scope cache
   *
   * @returns Number of cached instances in the current scope
   */
  size(): number {
    const store = this.storage.getStore();
    return store?.size || 0;
  }
}
