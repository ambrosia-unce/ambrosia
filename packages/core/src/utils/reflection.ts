/**
 * Reflection utilities for working with tokens and types
 */

import type { Constructor, Token } from "../types";
import { InjectionToken } from "../types";

/**
 * Convert a token to a human-readable string
 * Used for error messages and debugging
 */
export function tokenToString(token: Token): string {
  if (token instanceof InjectionToken) {
    return token.toString();
  }

  if (typeof token === "function") {
    return token.name || "<anonymous>";
  }

  return String(token);
}

/**
 * Check if a value is a constructor function
 */
export function isConstructor(value: unknown): value is Constructor {
  return typeof value === "function" && (value as Function).prototype !== undefined;
}

/**
 * Check if a token is an InjectionToken
 */
export function isInjectionToken(token: unknown): token is InjectionToken {
  return token instanceof InjectionToken;
}
