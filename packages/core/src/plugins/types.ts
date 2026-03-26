/**
 * Plugin System Types
 *
 * Provides extension points for domain-specific functionality
 * without polluting the core DI container
 */

import type { IContainer } from "../interfaces/container.ts";
import type { Scope } from "../scope/types.ts";
import type { Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";

/**
 * Resolution context passed to plugin hooks
 * Contains information about the current resolution operation
 */
export interface ResolutionContext {
  /** The token being resolved */
  token: Token;

  /** The scope of the resolution */
  scope: Scope;

  /** Resolution depth (for circular dependency tracking) */
  depth: number;

  /** Parent token (if this is a dependency resolution) */
  parent?: Token;

  /** Resolution start time (for performance tracking) */
  startTime: number;

  /** Whether this is an optional resolution */
  optional: boolean;
}

/**
 * Custom scope handler
 * Allows plugins to register custom lifecycle scopes
 */
export interface ScopeHandler {
  /** Get cached instance for token */
  get(token: Token): unknown | undefined;

  /** Set cached instance for token */
  set(token: Token, instance: unknown): void;

  /** Check if token has cached instance */
  has(token: Token): boolean;

  /** Clear all cached instances */
  clear(): void;
}

/**
 * Plugin interface
 * Plugins can hook into container lifecycle events
 */
export interface Plugin {
  /** Plugin name (for identification) */
  name: string;

  /** Plugin version */
  version?: string;

  // ==================== Lifecycle Hooks ====================

  /**
   * Called when container is created
   * @param container The container instance
   */
  onContainerCreate?(container: IContainer): void;

  /**
   * Called before a token is resolved
   * @param token The token being resolved
   * @param context Resolution context
   */
  onBeforeResolve?(token: Token, context: ResolutionContext): void;

  /**
   * Called after a token is successfully resolved
   * @param token The token that was resolved
   * @param instance The resolved instance
   * @param context Resolution context
   */
  onAfterResolve?(token: Token, instance: unknown, context: ResolutionContext): void;

  /**
   * Called when resolution fails
   * @param error The error that occurred
   * @param context Resolution context
   */
  onError?(error: Error, context: ResolutionContext): void;

  // ==================== Lifecycle Hooks ====================

  /**
   * Called before onInit is invoked on a resolved instance
   * @param token The token that was resolved
   * @param instance The resolved instance (before onInit)
   * @param context Resolution context
   */
  onBeforeInit?(token: Token, instance: unknown, context: ResolutionContext): void;

  /**
   * Called after onInit completes on a resolved instance
   * @param token The token that was resolved
   * @param instance The resolved instance (after onInit)
   * @param context Resolution context
   */
  onAfterInit?(token: Token, instance: unknown, context: ResolutionContext): void;

  // ==================== Provider Hooks ====================

  /**
   * Called when a provider is registered
   * Can transform or validate the provider
   * @param provider The provider being registered
   * @returns The transformed provider (or original)
   */
  onRegisterProvider?(provider: Provider): Provider;

  // ==================== Custom Scopes ====================

  /**
   * Register a custom scope
   * @param name Scope name
   * @param handler Scope handler implementation
   */
  registerCustomScope?(name: string, handler: ScopeHandler): void;
}

/**
 * Plugin execution order
 */
export enum PluginPriority {
  /** Execute first */
  HIGHEST = 100,

  /** Execute early */
  HIGH = 75,

  /** Default priority */
  NORMAL = 50,

  /** Execute late */
  LOW = 25,

  /** Execute last */
  LOWEST = 0,
}

/**
 * Plugin with priority
 */
export interface PrioritizedPlugin {
  plugin: Plugin;
  priority: PluginPriority;
}
