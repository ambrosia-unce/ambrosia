/**
 * Core type definitions for the DI container
 */

/**
 * Constructor type for instantiable classes
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Abstract class constructor type
 */
export type Abstract<T = any> = abstract new (...args: any[]) => T;

/**
 * Any constructor type (regular or abstract)
 */
export type AnyConstructor<T = any> = Constructor<T> | Abstract<T>;

/**
 * Factory function type that can produce instances
 * Receives the container for resolving dependencies
 *
 * The container parameter provides a resolve method for dependency injection
 */
export type Factory<T = any> = (container: FactoryContainer) => T | Promise<T>;

/**
 * Container facade passed to factory functions (sync resolve)
 */
export interface FactoryContainer {
  resolve: <U = unknown>(token: Token<U>) => U;
  resolveOptional: <U = unknown>(token: Token<U>) => U | undefined;
}

/**
 * Container facade for async factory resolution
 * resolve/resolveOptional return Promises instead of sync values
 */
export interface AsyncFactoryContainer {
  resolve: <U = unknown>(token: Token<U>) => Promise<U>;
  resolveOptional: <U = unknown>(token: Token<U>) => Promise<U | undefined>;
}

/**
 * Import InjectionToken type (will be defined in token.ts)
 */
import type { InjectionToken } from "./token.ts";

/**
 * Token type - can be a class, abstract class, or InjectionToken
 * This is the primary way to identify dependencies
 */
export type Token<T = any> = Constructor<T> | Abstract<T> | InjectionToken<T>;

/**
 * Dependency metadata for a single dependency
 */
export interface DependencyMetadata {
  /** The token to resolve */
  token: Token;
  /** Whether this dependency is optional */
  optional: boolean;
  /** Parameter index for constructor injection */
  parameterIndex?: number;
  /** Property key for property injection */
  propertyKey?: string | symbol;
}
