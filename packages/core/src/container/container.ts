/**
 * Container - Main DI Container class
 *
 * This is the central orchestrator of the entire DI system.
 * It manages:
 * - Provider registration
 * - Dependency resolution
 * - Scope management
 * - Instance lifecycle
 */

import { AMB007, createError } from "../errors/error-codes.ts";
import { type LoadedPackInfo, packRegistry } from "../pack";
import { type Plugin, PluginManager, type PluginPriority } from "../plugins";
import { Resolver } from "../resolution";
import { DEFAULT_SCOPE, type RequestScopeStorage, type Scope, ScopeManager } from "../scope";
import type {
  ClassProvider,
  Constructor,
  Factory,
  FactoryProvider,
  Provider,
  Token,
  ValueProvider,
} from "../types";
import { validateProvider } from "../types";
import { getRegistry } from "./registry.ts";

/**
 * Container configuration options
 */
export interface ContainerOptions {
  /**
   * If true, automatically register providers from global Registry
   * @default true
   */
  autoRegister?: boolean;

  /**
   * If true, automatically resolve circular dependencies using lazy proxies
   * When enabled, circular dependencies will emit warnings instead of errors
   * @default false
   */
  autoResolveCircular?: boolean;

  /**
   * If true, enforce pack export boundaries.
   * Only tokens explicitly exported by packs can be resolved.
   * @default false
   */
  enforceExports?: boolean;

  /**
   * Container mode: 'development' or 'production'
   * - development: Full cycle detection, detailed errors
   * - production: Skip cycle detection for cached instances, optimized for speed
   * @default 'development'
   */
  mode?: "development" | "production";

  /**
   * Explicitly enable/disable cycle detection
   * Overrides the default behavior based on mode
   * @default true in development, false in production
   */
  enableCycleDetection?: boolean;
}

/**
 * Container class
 * Main entry point for dependency injection
 */
export class Container {
  /**
   * Provider storage (token -> provider mapping)
   */
  private providers = new Map<Token, Provider>();

  /**
   * Scope manager for caching instances
   */
  private readonly scopeManager: ScopeManager;

  /**
   * Dependency resolver
   */
  private resolver: Resolver;

  /**
   * Parent container (for child scopes)
   */
  private parent?: Container;

  /**
   * Container configuration options
   */
  private options: ContainerOptions;

  /**
   * Plugin manager for extensions
   */
  private readonly pluginManager: PluginManager;

  /**
   * Set of tokens that are exported by packs (for export enforcement)
   */
  private exportedTokens?: Set<Token>;

  /**
   * Create a new Container instance
   *
   * @param options Container configuration options or boolean for autoRegister (legacy)
   */
  constructor(options: ContainerOptions | boolean = true) {
    if (typeof options === "boolean") {
      this.options = {
        autoRegister: options,
        autoResolveCircular: false,
        mode: "development",
      };
    } else {
      const mode = options.mode ?? "development";
      this.options = {
        autoRegister: options.autoRegister ?? true,
        autoResolveCircular: options.autoResolveCircular ?? false,
        enforceExports: options.enforceExports ?? false,
        mode,
        enableCycleDetection: options.enableCycleDetection ?? mode === "development",
      };
    }

    this.scopeManager = new ScopeManager();
    this.pluginManager = new PluginManager();
    this.resolver = new Resolver({
      scopeManager: this.scopeManager,
      getProvider: (token) => this.getProviderInternal(token),
      autoResolveCircular: this.options.autoResolveCircular,
      enableCycleDetection: this.options.enableCycleDetection ?? true,
      mode: this.options.mode ?? "development",
      container: this,
      pluginManager: this.pluginManager,
    });

    // Performance optimization: Pre-populate providers from registry
    // This flattens the lookup and avoids recursive parent + registry checks
    if (this.options.autoRegister) {
      this.autoRegisterFromRegistry();
    }

    // Notify plugins that container was created
    this.pluginManager.executeOnContainerCreate(this);
  }

  // ==================== Plugin System ====================

  /**
   * Get the request scope storage for wrapping request contexts
   *
   * @example
   * ```TypeScript
   * container.requestStorage.run(() => {
   *   const ctx = container.resolve(RequestContext);
   *   // ctx is scoped to this async context
   * });
   * ```
   */
  get requestStorage(): RequestScopeStorage {
    return this.scopeManager.getRequestStorage();
  }

  /**
   * Get the number of registered providers
   */
  get size(): number {
    return this.providers.size;
  }

  /**
   * Register a plugin
   *
   * @param plugin The plugin to register
   * @param priority Plugin execution priority (default: NORMAL)
   * @returns this container for chaining
   *
   * @example
   * ```TypeScript
   * container
   *   .use(new TelemetryPlugin())
   *   .use(new LoggingPlugin(), PluginPriority.HIGH);
   * ```
   */
  use(plugin: Plugin, priority?: PluginPriority): this {
    this.pluginManager.register(plugin, priority);
    return this;
  }

  // ==================== Provider Registration ====================

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return this.pluginManager.getPlugins();
  }

  /**
   * Check if a plugin is registered
   *
   * @param pluginName The name of the plugin
   */
  hasPlugin(pluginName: string): boolean {
    return this.pluginManager.hasPlugin(pluginName);
  }

  /**
   * Register a provider
   *
   * @param provider The provider to register
   *
   * @example
   * ```TypeScript
   * container.register({
   *   token: UserService,
   *   useClass: UserService,
   *   scope: Scope.SINGLETON
   * });
   * ```
   */
  register<T>(provider: Provider<T>): void {
    validateProvider(provider);

    // Allow plugins to transform the provider
    const transformedProvider = this.pluginManager.executeOnRegisterProvider(provider);

    this.providers.set(transformedProvider.token, transformedProvider);
  }

  /**
   * Register a class provider
   *
   * @param token The token to register under
   * @param useClass The class to instantiate
   * @param scope The lifecycle scope (default: SINGLETON)
   *
   * @example
   * ```TypeScript
   * container.registerClass(UserService, UserService);
   * ```
   */
  registerClass<T>(token: Token<T>, useClass: Constructor<T>, scope: Scope = DEFAULT_SCOPE): void {
    const provider: ClassProvider<T> = {
      token,
      useClass,
      scope,
    };
    this.register(provider);
  }

  /**
   * Register a value provider (constant)
   *
   * @param token The token to register under
   * @param value The value to provide
   *
   * @example
   * ```TypeScript
   * const CONFIG = new InjectionToken<AppConfig>('AppConfig');
   * container.registerValue(CONFIG, { apiUrl: 'https://api.example.com' });
   * ```
   */
  registerValue<T>(token: Token<T>, value: T): void {
    const provider: ValueProvider<T> = {
      token,
      useValue: value,
    };
    this.register(provider);
  }

  /**
   * Register a factory provider
   *
   * @param token The token to register under
   * @param factory The factory function
   * @param scope The lifecycle scope (default: SINGLETON)
   * @param deps Optional explicit dependencies
   *
   * @example
   * ```TypeScript
   * container.registerFactory(
   *   Logger,
   *   (container) => new Logger(container.resolve(CONFIG)),
   *   Scope.SINGLETON
   * );
   * ```
   */
  registerFactory<T>(
    token: Token<T>,
    factory: Factory<T>,
    scope: Scope = DEFAULT_SCOPE,
    deps?: Token[],
  ): void {
    const provider: FactoryProvider<T> = {
      token,
      useFactory: factory,
      scope,
      deps,
    };
    this.register(provider);
  }

  // ==================== Resolution ====================

  /**
   * Register an existing provider (alias)
   *
   * @param token The token to register
   * @param existingToken The token to alias to
   *
   * @example
   * ```TypeScript
   * container.registerExisting(ILogger, ConsoleLogger);
   * ```
   */
  registerExisting<T>(token: Token<T>, existingToken: Token<T>): void {
    const provider = {
      token,
      useExisting: existingToken,
    };
    this.register(provider);
  }

  /**
   * Register an instance directly (bypasses scope management)
   * Useful for pre-created instances
   *
   * @param token The token to register
   * @param instance The instance to register
   */
  registerInstance<T>(token: Token<T>, instance: T): void {
    this.registerValue(token, instance);
  }

  /**
   * Set the exported tokens for export enforcement.
   * When enforceExports is enabled, only tokens in this set can be resolved.
   *
   * @param tokens Set of exported tokens
   */
  setExportedTokens(tokens: Set<Token>): void {
    this.exportedTokens = tokens;
  }

  /**
   * Check if a token is allowed by export enforcement.
   * Throws if enforceExports is enabled and the token is not exported.
   */
  private checkExportEnforcement(token: Token): void {
    if (this.options.enforceExports && this.exportedTokens && !this.exportedTokens.has(token)) {
      const name = typeof token === "function" ? token.name : String(token);
      throw createError(
        AMB007,
        `Token "${name}" is not exported by any pack`,
        { token: name },
      );
    }
  }

  /**
   * Resolve a dependency by token
   *
   * @param token The token to resolve
   * @returns The resolved instance
   * @throws {ProviderNotFoundError} if provider not found
   * @throws {CircularDependencyError} if circular dependency detected
   *
   * @example
   * ```TypeScript
   * const userService = container.resolve(UserService);
   * ```
   */
  resolve<T = unknown>(token: Token<T>): T {
    this.checkExportEnforcement(token);
    const result = this.resolver.resolve(token, false);
    return result as T;
  }

  /**
   * Resolve an optional dependency
   * Returns undefined if provider not found instead of throwing
   *
   * @param token The token to resolve
   * @returns The resolved instance or undefined
   *
   * @example
   * ```TypeScript
   * const cache = container.resolveOptional(CacheService);
   * if (cache) {
   *   cache.set('key', 'value');
   * }
   * ```
   */
  resolveOptional<T = unknown>(token: Token<T>): T | undefined {
    this.checkExportEnforcement(token);
    return this.resolver.resolve(token, true);
  }

  // ==================== Scope Management ====================

  /**
   * Async resolution for handling async factories
   *
   * @param token The token to resolve
   * @returns Promise resolving to the instance
   *
   * @example
   * ```TypeScript
   * const dbConnection = await container.resolveAsync(Database);
   * ```
   */
  async resolveAsync<T = unknown>(token: Token<T>): Promise<T> {
    this.checkExportEnforcement(token);
    const result = await this.resolver.resolveAsync(token, false);
    return result as T;
  }

  /**
   * Async resolution for optional dependencies
   *
   * @param token The token to resolve
   * @returns Promise resolving to the instance or undefined
   */
  async resolveOptionalAsync<T = unknown>(token: Token<T>): Promise<T | undefined> {
    this.checkExportEnforcement(token);
    return this.resolver.resolveAsync(token, true);
  }

  /**
   * Create a child container (for scoped resolution)
   * Child containers inherit providers from parent but have separate caches
   *
   * @returns A new child container
   */
  createChild(): Container {
    const child = new Container({
      autoRegister: false,
      autoResolveCircular: this.options.autoResolveCircular,
      mode: this.options.mode,
      enableCycleDetection: this.options.enableCycleDetection,
    });
    child.parent = this;
    return child;
  }

  /**
   * Clear all cached instances for a specific scope
   *
   * @param scope The scope to clear
   */
  clearScope(scope: Scope): void {
    this.scopeManager.clearScope(scope);
  }

  // ==================== Provider Management ====================

  /**
   * Clear all cached instances across all scopes
   */
  clearAll(): void {
    this.scopeManager.clearAll();
  }

  /**
   * Destroy all instances: execute OnDestroy hooks (LIFO), then clear caches.
   */
  async destroyAll(): Promise<Error[]> {
    return this.scopeManager.destroyAll();
  }

  /**
   * Check if a provider is registered for a token
   *
   * @param token The token to check
   * @returns true if a provider exists
   */
  has(token: Token): boolean {
    return this.providers.has(token) || this.parent?.has(token) || false;
  }

  /**
   * Get all registered tokens
   *
   * @returns Array of all tokens
   */
  getTokens(): Token[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Remove a provider
   *
   * @param token The token to remove
   * @returns true if the provider was removed
   */
  remove(token: Token): boolean {
    return this.providers.delete(token);
  }

  /**
   * Get diagnostic information about the container
   * Useful for debugging
   */
  getDiagnostics(): {
    providerCount: number;
    singletonCacheSize: number;
    requestCacheSize: number;
    hasParent: boolean;
  } {
    return {
      providerCount: this.providers.size,
      singletonCacheSize: this.scopeManager.getSingletonCacheSize(),
      requestCacheSize: this.scopeManager.getRequestCacheSize(),
      hasParent: this.parent !== undefined,
    };
  }

  /**
   * Create a snapshot of the current container state
   * Returns all providers (useful for debugging/testing)
   */
  snapshot(): Provider[] {
    return Array.from(this.providers.values());
  }

  // ==================== Pack Introspection ====================

  /**
   * Get all loaded packs from the global pack registry.
   */
  getLoadedPacks(): LoadedPackInfo[] {
    return packRegistry.getAll();
  }

  /**
   * Get a loaded pack by name.
   */
  getPack(name: string): LoadedPackInfo | undefined {
    return packRegistry.get(name);
  }

  // ==================== Utility Methods ====================

  /**
   * Get a provider by token (internal method)
   * Performance optimized: Single lookup in most cases
   */
  private getProviderInternal(token: Token): Provider | undefined {
    // Fast path: Single Map lookup (providers are pre-populated from parent + registry)
    const provider = this.providers.get(token);
    if (provider) {
      return provider;
    }

    // Slow path: Check parent container (only needed for child containers created after parent was modified)
    if (this.parent) {
      const parentProvider = this.parent.getProviderInternal(token);
      if (parentProvider) {
        // Cache it locally for faster future lookups
        this.providers.set(token, parentProvider);
        return parentProvider;
      }
    }

    // Last resort: Check global Registry (only when autoRegister is enabled)
    if (this.options.autoRegister) {
      const registry = getRegistry();
      const registryProvider = registry.getProvider(token);
      if (registryProvider) {
        // Cache it locally for faster future lookups
        this.providers.set(token, registryProvider);
        return registryProvider;
      }
    }

    return undefined;
  }

  /**
   * Auto-register providers from the global Registry
   */
  private autoRegisterFromRegistry(): void {
    const registry = getRegistry();
    registry.autoRegisterTo((provider) => {
      // Only register if not already registered
      if (!this.providers.has(provider.token)) {
        this.providers.set(provider.token, provider);
      }
    });
  }
}

/**
 * Create and export a default container instance
 */
export const container = new Container();
