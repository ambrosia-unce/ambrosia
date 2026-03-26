/**
 * Lazy Proxy - Automatic circular dependency resolution
 *
 * Creates a proxy object that resolves the real object on first access.
 * This allows automatic breaking of circular dependencies.
 */

import { DIError } from "../container";
import type { IContainer } from "../interfaces";
import type { Token } from "../types";
import { tokenToString } from "../utils";

/**
 * Create a lazy proxy for a token
 *
 * @param token Token to resolve
 * @param container Container for resolution
 * @returns Proxy object
 */
export function createLazyProxy<T extends object>(token: Token<T>, container: IContainer): T {
  let resolved: T | null = null;
  let resolving = false;

  // Function to get the real target object
  const getTarget = (): T => {
    if (resolved) {
      return resolved;
    }

    if (resolving) {
      throw new DIError(
        `Circular dependency in lazy proxy: attempting to access proxy before resolution completes for ${tokenToString(token)}`,
      );
    }

    resolving = true;
    try {
      // Use public API to check if instance is already cached
      const cached = container.resolveOptional(token);
      if (cached !== undefined && cached !== null) {
        resolved = cached;
        return resolved;
      }

      // If not cached yet, try to resolve directly
      // This should work if the instance was created but not yet cached
      // (shouldn't happen in normal flow, but handle gracefully)
      try {
        resolved = container.resolve(token);
        return resolved;
      } catch (error) {
        throw new DIError(
          `Lazy proxy accessed during circular resolution - instance not ready yet for ${tokenToString(token)}. ` +
            `Avoid calling methods on circular dependencies during construction. ` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } finally {
      resolving = false;
    }
  };

  // Create a proxy that forwards all operations to the real object
  const proxy = new Proxy({} as T, {
    // Intercept property access
    get(_target, prop, _receiver) {
      if (prop === "__isLazyProxy") return true;

      const realTarget = getTarget();
      const value = Reflect.get(realTarget, prop, realTarget);

      // If it's a function, bind the context
      if (typeof value === "function") {
        return value.bind(realTarget);
      }

      return value;
    },

    // Intercept property assignment
    set(_target, prop, value, _receiver) {
      const realTarget = getTarget();
      return Reflect.set(realTarget, prop, value, realTarget);
    },

    // Intercept 'in' operator
    has(_target, prop) {
      if (prop === "__isLazyProxy") return true;

      const realTarget = getTarget();
      return Reflect.has(realTarget, prop);
    },

    // Intercept Object.keys, etc.
    ownKeys(_target) {
      const realTarget = getTarget();
      return Reflect.ownKeys(realTarget);
    },

    // Intercept Object.getOwnPropertyDescriptor
    getOwnPropertyDescriptor(_target, prop) {
      const realTarget = getTarget();
      return Reflect.getOwnPropertyDescriptor(realTarget, prop);
    },

    // Intercept Object.getPrototypeOf / instanceof
    getPrototypeOf(_target) {
      const realTarget = getTarget();
      return Reflect.getPrototypeOf(realTarget);
    },

    // Intercept delete operator
    deleteProperty(_target, prop) {
      const realTarget = getTarget();
      return Reflect.deleteProperty(realTarget, prop);
    },

    // Intercept Object.defineProperty
    defineProperty(_target, prop, descriptor) {
      const realTarget = getTarget();
      return Reflect.defineProperty(realTarget, prop, descriptor);
    },

    // Intercept function calls (if object is a function)
    apply(_target, thisArg, args) {
      const realTarget = getTarget();
      if (typeof realTarget === "function") {
        return Reflect.apply(realTarget, thisArg, args);
      }
      throw new TypeError("Target is not a function");
    },

    // Intercept new operator (if object is a constructor)
    construct(_target, args, newTarget) {
      const realTarget = getTarget();
      if (typeof realTarget === "function") {
        return Reflect.construct(realTarget, args, newTarget);
      }
      throw new TypeError("Target is not a constructor");
    },
  });

  return proxy;
}

/**
 * Check if an object is a lazy proxy
 */
export function isLazyProxy(obj: unknown): boolean {
  return obj != null && typeof obj === "object" && "__isLazyProxy" in obj;
}
