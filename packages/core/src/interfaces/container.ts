/**
 * IContainer - Minimal container interface
 *
 * Used in Plugin, PackDefinition, and Resolver to avoid coupling to the
 * concrete Container class, and to eliminate `any` container parameters.
 */

import type { Plugin, PluginPriority } from "../plugins/types.ts";
import type { RequestScopeStorage } from "../scope/request-scope-storage.ts";
import type { Scope } from "../scope/types.ts";
import type { Constructor, Factory, Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";

export interface IContainer {
  /** Get the request scope storage */
  readonly requestStorage: RequestScopeStorage;

  /** Get the number of registered providers */
  readonly size: number;

  // ==================== Plugin System ====================

  /** Register a plugin */
  use(plugin: Plugin, priority?: PluginPriority): this;

  /** Get all registered plugins */
  getPlugins(): Plugin[];

  /** Check if a plugin is registered */
  hasPlugin(pluginName: string): boolean;

  // ==================== Provider Registration ====================

  /** Register a provider */
  register<T>(provider: Provider<T>): void;

  /** Register a class provider */
  registerClass<T>(token: Token<T>, useClass: Constructor<T>, scope?: Scope): void;

  /** Register a value provider */
  registerValue<T>(token: Token<T>, value: T): void;

  /** Register a factory provider */
  registerFactory<T>(token: Token<T>, factory: Factory<T>, scope?: Scope, deps?: Token[]): void;

  /** Register an existing provider (alias) */
  registerExisting<T>(token: Token<T>, existingToken: Token<T>): void;

  /** Register an instance directly */
  registerInstance<T>(token: Token<T>, instance: T): void;

  // ==================== Resolution ====================

  /** Resolve a dependency by token */
  resolve<T = unknown>(token: Token<T>): T;

  /** Resolve an optional dependency */
  resolveOptional<T = unknown>(token: Token<T>): T | undefined;

  /** Async resolution */
  resolveAsync<T = unknown>(token: Token<T>): Promise<T>;

  /** Async resolution for optional dependencies */
  resolveOptionalAsync<T = unknown>(token: Token<T>): Promise<T | undefined>;

  // ==================== Scope Management ====================

  /** Create a child container */
  createChild(): IContainer;

  /** Clear all cached instances for a specific scope */
  clearScope(scope: Scope): void;

  /** Clear all cached instances */
  clearAll(): void;

  /** Destroy all instances, returning any errors from onDestroy hooks */
  destroyAll(): Promise<Error[]>;

  // ==================== Provider Management ====================

  /** Check if a provider is registered */
  has(token: Token): boolean;

  /** Get all registered tokens */
  getTokens(): Token[];

  /** Remove a provider */
  remove(token: Token): boolean;
}
