/**
 * Scope types for dependency lifecycle management
 */

/**
 * Provider scope determines the lifecycle of instances
 *
 * - SINGLETON: One instance shared across the entire application (cached forever)
 * - TRANSIENT: New instance created for every resolution (never cached)
 * - REQUEST: One instance per request context (cached in AsyncLocalStorage)
 */
export enum Scope {
  /**
   * Singleton scope - one instance per container
   * Instance is created once and cached indefinitely
   *
   * Use for:
   * - Database connections
   * - Configuration services
   * - Stateless services
   * - Logger instances
   */
  SINGLETON = "singleton",

  /**
   * Transient scope - new instance every time
   * Instance is never cached, always created fresh
   *
   * Use for:
   * - Request handlers
   * - DTOs / value objects
   * - Temporary processors
   * - Stateful objects that shouldn't be shared
   */
  TRANSIENT = "transient",

  /**
   * Request scope - one instance per request context
   * Instance is cached in AsyncLocalStorage for the duration of the async context
   *
   * Use for:
   * - Request-specific context
   * - User session data
   * - Request-scoped caches
   * - Anything that should be isolated per request
   *
   * Requires wrapping code in container.requestStorage.run(() => { ... })
   */
  REQUEST = "request",
}

/**
 * Default scope for providers when not specified
 */
export const DEFAULT_SCOPE = Scope.SINGLETON;
