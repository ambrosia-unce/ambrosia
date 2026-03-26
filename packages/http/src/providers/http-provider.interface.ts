/**
 * HTTP Provider abstraction interface
 *
 * Allows switching between different HTTP providers
 * while maintaining the same application code.
 */

import type { HttpMethod } from "../types/common.ts";

/**
 * Route configuration for provider registration
 * Generic over context type for type safety with native provider
 */
export interface RouteConfig<TContext = any> {
  /**
   * HTTP method (GET, POST, etc.)
   */
  method: HttpMethod;

  /**
   * Route path
   */
  path: string;

  /**
   * Route handler function
   * Receives native provider context and returns response
   */
  handler: (context: TContext) => any | Promise<any>;
}

/**
 * Base HTTP Provider interface
 *
 * Factory pattern - providers are created, not injected
 * Generics preserve type safety with native framework
 */
export interface HttpProvider<TApp = any, TContext = any> {
  /**
   * Provider name for debugging
   */
  readonly name: string;

  /**
   * Get the native framework instance
   * Allows direct access to framework-specific features
   */
  getNativeApp(): TApp;

  /**
   * Register a route handler
   *
   * PERFORMANCE: Direct passthrough to native provider
   * Should have minimal overhead
   */
  registerRoute(config: RouteConfig<TContext>): void;

  /**
   * Use middleware/plugin
   * Framework-specific middleware can be registered
   */
  use(middleware: any): void;

  /**
   * Start listening on port
   */
  listen(port: number): Promise<void>;

  /**
   * Gracefully stop the server and release resources.
   * Optional — providers that don't need cleanup can omit this.
   */
  close?(): Promise<void>;
}
