/**
 * Dependency Graph - Tracks dependency resolution chain and detects cycles
 *
 * Uses a stack-based approach to track the current resolution chain.
 * If we encounter a token that's already in the chain, we have a circular dependency.
 *
 * Supports both sync and async contexts:
 * - Sync: uses shared instance fields (resolutionChain / resolutionSet)
 * - Async: uses AsyncLocalStorage so concurrent resolveAsync() calls get isolated chains
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { CircularDependencyError } from "../container/errors.ts";
import type { Token } from "../types/common.ts";
import { globalLogger } from "../utils/logger.ts";
import { tokenToString } from "../utils/reflection.ts";

interface AsyncGraphState {
  chain: Token[];
  set: Set<Token>;
}

/**
 * Dependency Graph class
 * Manages the resolution chain and detects circular dependencies
 */
export class DependencyGraph {
  /**
   * Current resolution chain (stack of tokens being resolved) — sync fallback
   */
  private resolutionChain: Token[] = [];

  /**
   * Set for O(1) lookup of tokens in the resolution chain — sync fallback
   */
  private resolutionSet = new Set<Token>();

  /**
   * AsyncLocalStorage for isolated async resolution contexts
   */
  private asyncStorage = new AsyncLocalStorage<AsyncGraphState>();

  /**
   * Get the current state (async-aware).
   * Returns the async store if inside runAsync(), otherwise the sync fields.
   */
  private getState(): { chain: Token[]; set: Set<Token> } {
    const store = this.asyncStorage.getStore();
    if (store) {
      return store;
    }
    return { chain: this.resolutionChain, set: this.resolutionSet };
  }

  /**
   * Check if currently inside an async context
   */
  isInAsyncContext(): boolean {
    return this.asyncStorage.getStore() !== undefined;
  }

  /**
   * Run a callback with an isolated async resolution context.
   * Each call gets its own chain/set so concurrent resolveAsync() calls don't interfere.
   */
  runAsync<T>(cb: () => Promise<T>): Promise<T> {
    return this.asyncStorage.run({ chain: [], set: new Set<Token>() }, cb);
  }

  /**
   * Enter a token into the resolution chain
   *
   * @param token The token being resolved
   * @param autoResolveCircular If true, emit warning instead of throwing on circular dependency
   * @throws {CircularDependencyError} if the token is already in the chain (unless autoResolveCircular is true)
   * @returns true if circular dependency was detected, false otherwise
   */
  enter(token: Token, autoResolveCircular = false): boolean {
    const state = this.getState();

    // Check if this token is already in the resolution chain (O(1) lookup)
    if (state.set.has(token)) {
      // Circular dependency detected - build the full chain for error message
      const chainIndex = state.chain.indexOf(token);
      const cycle = [...state.chain.slice(chainIndex), token];

      if (autoResolveCircular) {
        // Emit warning but allow resolution to continue
        const chainStr = cycle.map(tokenToString).join(" → ");
        globalLogger.warn(
          `⚠️  Circular dependency detected: ${chainStr}\n` +
            "   Auto-resolving using lazy proxy...",
        );
        return true; // Signal that circular dependency was detected
      }

      throw new CircularDependencyError(cycle);
    }

    // Add to the resolution chain and set
    state.chain.push(token);
    state.set.add(token);
    return false; // No circular dependency
  }

  /**
   * Exit a token from the resolution chain
   * Should be called after successful resolution (in finally block)
   *
   * @param token The token that was resolved
   */
  exit(token: Token): void {
    const state = this.getState();
    const popped = state.chain.pop();

    if (popped !== token) {
      // Mismatch: clean up both the popped token and the expected token
      // to prevent stale entries from corrupting future cycle detection
      if (popped) {
        state.set.delete(popped);
      }
      state.set.delete(token);

      globalLogger.warn(
        `DependencyGraph.exit: Expected to exit ${tokenToString(token)}, ` +
          `but popped ${popped ? tokenToString(popped) : "undefined"}`,
      );
    } else if (popped) {
      state.set.delete(popped);
    }
  }

  /**
   * Get the current resolution chain (for debugging)
   *
   * @returns Array of tokens in the current resolution chain
   */
  getChain(): Token[] {
    return [...this.getState().chain];
  }

  /**
   * Get the current resolution depth
   *
   * @returns Number of tokens in the resolution chain
   */
  getDepth(): number {
    return this.getState().chain.length;
  }

  /**
   * Check if currently resolving a specific token
   *
   * @param token The token to check
   * @returns true if the token is in the resolution chain
   */
  isResolving(token: Token): boolean {
    return this.getState().set.has(token);
  }

  /**
   * Clear the resolution chain (useful for testing or error recovery)
   */
  clear(): void {
    const store = this.asyncStorage.getStore();
    if (store) {
      store.chain.length = 0;
      store.set.clear();
    } else {
      this.resolutionChain = [];
      this.resolutionSet.clear();
    }
  }

  /**
   * Get a formatted string representation of the current chain
   *
   * @returns Human-readable chain representation
   */
  toString(): string {
    const chain = this.getState().chain;
    if (chain.length === 0) {
      return "<empty>";
    }
    return chain.map(tokenToString).join(" → ");
  }
}
