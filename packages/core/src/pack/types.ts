/**
 * Pack System Types
 *
 * A Pack is a reusable bundle of providers and configuration for the DI container.
 * Pure DI concept — no HTTP-specific fields (controllers, etc).
 */

import type { IContainer } from "../interfaces/container.ts";
import type { Constructor, Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";

/**
 * Pack metadata for introspection and discovery.
 */
export interface PackMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  tags?: string[];
}

/**
 * A PackDefinition or a falsy value (for conditional loading).
 *
 * @example
 * ```typescript
 * packs: [
 *   CorePack.forRoot(),
 *   process.env.CACHE_ENABLED && CachePack.forRoot(cacheConfig),
 * ]
 * ```
 */
export type Packable = PackDefinition | null | undefined | false;

/**
 * PackDefinition - The output of Pack.forRoot() or a plain pack object.
 *
 * @example Simple pack:
 * ```typescript
 * export const LoggingPack: PackDefinition = {
 *   meta: { name: "logging", version: "1.0.0" },
 *   providers: [LoggingService],
 *   exports: [LoggingService],
 * };
 * ```
 *
 * @example Configurable pack with lifecycle:
 * ```typescript
 * export class DatabasePack {
 *   static forRoot(config: DatabaseConfig): PackDefinition {
 *     return {
 *       meta: { name: "database" },
 *       providers: [
 *         { token: DATABASE_CONFIG, useValue: config },
 *         DatabaseService,
 *       ],
 *       exports: [DatabaseService],
 *       async onInit(container) {
 *         const db = container.resolve(DatabaseService);
 *         await db.connect();
 *       },
 *       async onDestroy() {
 *         // cleanup
 *       },
 *     };
 *   }
 * }
 * ```
 */
export interface PackDefinition {
  /**
   * Pack metadata for introspection.
   */
  meta?: PackMetadata;

  /**
   * Providers to register in the container.
   * Can be full Provider objects or bare Constructor classes (shorthand for ClassProvider).
   */
  providers?: (Provider | Constructor)[];

  /**
   * Tokens that this pack exports for use by other packs.
   *
   * If not specified, all providers are exported (backward compatible).
   * If specified, only these tokens are visible outside the pack.
   */
  exports?: Token[];

  /**
   * Other packs that this pack depends on.
   * Processed before this pack's providers are registered (depth-first).
   * Supports falsy values for conditional imports.
   */
  imports?: Packable[];

  /**
   * Lazy imports — resolved at processing time.
   * Useful for breaking circular pack dependencies.
   */
  lazyImports?: () => Packable[];

  /**
   * Called after pack's providers are registered in the container.
   * Can perform async initialization (DB connections, cache warming, etc).
   */
  onInit?: (container: IContainer) => void | Promise<void>;

  /**
   * Called on application shutdown for graceful cleanup.
   * Executed in reverse order (LIFO).
   */
  onDestroy?: () => void | Promise<void>;
}

/**
 * Options for async pack configuration (forRootAsync pattern).
 */
export interface AsyncPackOptions<TConfig = any> {
  /**
   * Factory function that produces the configuration.
   * Dependencies from `inject` are auto-resolved and passed as arguments.
   */
  useFactory: (...args: unknown[]) => TConfig | Promise<TConfig>;

  /**
   * Dependency tokens to inject into the factory function.
   * Resolved from the container and passed to useFactory in order.
   */
  inject?: Token[];
}

/**
 * Type guard: check if an item is a bare constructor (shorthand provider).
 */
export function isConstructorProvider(item: Provider | Constructor): item is Constructor {
  return typeof item === "function" && !("token" in item);
}
