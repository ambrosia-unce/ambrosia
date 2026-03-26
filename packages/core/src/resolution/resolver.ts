/**
 * Resolver - Core dependency resolution logic
 *
 * This is the heart of the DI system. It handles:
 * - Provider resolution
 * - Constructor injection
 * - Property injection
 * - Circular dependency detection
 * - Scope management
 */

import {
  AsyncInSyncError,
  DIError,
  InstantiationError,
  InvalidProviderError,
  PropertyInjectionError,
  ProviderNotFoundError,
  ResolutionError,
} from "../container";
import type { IContainer } from "../interfaces";
import { hasOnDestroy, hasOnInit } from "../interfaces";
import { MetadataManager } from "../metadata";
import type { PluginManager, ResolutionContext } from "../plugins";
import type { ScopeManager } from "../scope";
import { DEFAULT_SCOPE } from "../scope";
import type {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from "../types";
import { isClassProvider, isExistingProvider, isFactoryProvider, isValueProvider } from "../types";
import type { AsyncFactoryContainer, Constructor, Token } from "../types/common.ts";
import { tokenToString } from "../utils";
import { globalLogger } from "../utils/logger.ts";
import { DependencyGraph } from "./dependency-graph.ts";
import { createLazyProxy } from "./lazy-proxy.ts";
import { ParameterResolver } from "./parameter-resolver.ts";

/**
 * Resolver options
 */
export interface ResolverOptions {
  /** Scope manager for caching instances */
  scopeManager: ScopeManager;
  /** Function to get a provider by token */
  getProvider: (token: Token) => Provider | undefined;
  /** If true, automatically resolve circular dependencies using lazy proxies */
  autoResolveCircular?: boolean;
  /** Enable/disable cycle detection (default: true in development, false in production) */
  enableCycleDetection?: boolean;
  /** Container mode: 'development' or 'production' */
  mode?: "development" | "production";
  /** Container instance (needed for lazy proxy creation) */
  container?: IContainer;
  /** Plugin manager for resolution hooks */
  pluginManager?: PluginManager;
}

/**
 * Resolver class
 * Handles all dependency resolution logic
 */
export class Resolver {
  private scopeManager: ScopeManager;
  private getProvider: (token: Token) => Provider | undefined;
  private dependencyGraph: DependencyGraph;
  private autoResolveCircular: boolean;
  private enableCycleDetection: boolean;
  private mode: "development" | "production";
  private container?: IContainer;
  private pluginManager?: PluginManager;
  /** Stack tracking parent tokens during resolution */
  private resolutionStack: Token[] = [];

  constructor(options: ResolverOptions) {
    this.scopeManager = options.scopeManager;
    this.getProvider = options.getProvider;
    this.autoResolveCircular = options.autoResolveCircular ?? false;
    this.mode = options.mode ?? "development";
    this.enableCycleDetection = options.enableCycleDetection ?? this.mode === "development";
    this.container = options.container;
    this.pluginManager = options.pluginManager;
    this.dependencyGraph = new DependencyGraph();
  }

  /**
   * Create a resolution context for plugin hooks
   */
  private createResolutionContext(
    token: Token,
    scope: string,
    optional: boolean,
  ): ResolutionContext {
    return {
      token,
      scope: scope as ResolutionContext["scope"],
      depth: this.dependencyGraph.getDepth(),
      parent:
        this.resolutionStack.length > 0
          ? this.resolutionStack[this.resolutionStack.length - 1]
          : undefined,
      startTime: performance.now(),
      optional,
    };
  }

  // ==================== Shared Resolution Helpers ====================

  /**
   * Look up a provider and return it with its scope, or handle missing provider.
   * Returns undefined only when optional=true and no provider found.
   */
  private lookupProvider<T>(
    token: Token<T>,
    optional: boolean,
  ): { provider: Provider; scope: string } | undefined {
    const provider = this.getProvider(token);
    if (!provider) {
      if (optional) return undefined;
      throw new ProviderNotFoundError(
        token,
        this.resolutionStack.length > 0 ? [...this.resolutionStack, token] : undefined,
      );
    }
    return { provider, scope: provider.scope || DEFAULT_SCOPE };
  }

  /**
   * Try to resolve from cache. Returns the cached value or undefined on miss.
   * Fires plugin hooks on cache hit.
   */
  private resolveFromCache<T>(
    token: Token<T>,
    scope: string,
    context: ResolutionContext | undefined,
  ): T | undefined {
    const cached = this.scopeManager.get(token, scope);
    if (cached !== undefined) {
      if (this.pluginManager && context) {
        this.pluginManager.executeOnAfterResolve(token, cached, context);
      }
      return cached;
    }
    return undefined;
  }

  /**
   * Enter cycle detection. Returns a lazy proxy if circular + autoResolve,
   * or undefined to continue normal resolution.
   */
  private enterCycleDetection<T>(token: Token<T>): T | undefined {
    if (!this.enableCycleDetection) return undefined;

    const isCircular = this.dependencyGraph.enter(token, this.autoResolveCircular);
    if (isCircular && this.autoResolveCircular) {
      if (!this.container) {
        throw new DIError("Cannot auto-resolve circular dependency: container not available");
      }
      // Cast is safe: circular deps only occur with class providers (always object)
      return createLazyProxy(token as Token<T & object>, this.container) as T;
    }
    return undefined;
  }

  /**
   * Cache instance, track onDestroy, and handle class-specific post-processing.
   */
  private cacheAndTrack<T>(token: Token<T>, scope: string, instance: T, provider: Provider): void {
    const alreadyCached = this.scopeManager.get(token, scope);
    if (!alreadyCached) {
      this.scopeManager.set(token, scope, instance);
    }

    if (isClassProvider(provider) && hasOnDestroy(instance)) {
      this.scopeManager.trackForDestroy(token, instance);
    }
  }

  /**
   * Resolve a class provider instance: construct, early-cache, then inject properties.
   *
   * Early caching (before property injection) is required to break circular
   * dependencies via @Autowired — when a dependency resolves the current token
   * during property injection, it finds the instance in cache instead of
   * triggering a circular dependency error.
   *
   * If property injection fails, the partially-initialized instance is rolled
   * back from cache to prevent future resolves from returning a broken instance.
   */
  private resolveClassInstance<T>(provider: ClassProvider<T>, token: Token<T>, scope: string): T {
    const instance = this.resolveClass(provider);

    const earlyCached = scope === "singleton" || scope === "request";
    if (earlyCached) {
      this.scopeManager.set(token, scope, instance);
    }

    try {
      this.injectProperties(instance as Record<string | symbol, unknown>, provider.useClass);
    } catch (error) {
      // Rollback: remove partially-initialized instance from cache
      if (earlyCached) {
        this.scopeManager.delete(token, scope);
      }
      throw error;
    }

    return instance;
  }

  /**
   * Wrap resolution errors with context.
   */
  private wrapError(error: unknown, token: Token, context: ResolutionContext | undefined): never {
    if (this.pluginManager && context) {
      this.pluginManager.executeOnError(
        error instanceof Error ? error : new Error(String(error)),
        context,
      );
    }

    if (error instanceof DIError) {
      throw error;
    }
    throw new ResolutionError(
      token,
      error instanceof Error ? error : new Error(String(error)),
      this.resolutionStack.slice(),
    );
  }

  /**
   * Clean up after resolution: pop stack and exit dependency graph.
   */
  private exitResolution(token: Token): void {
    this.resolutionStack.pop();
    if (this.enableCycleDetection) {
      this.dependencyGraph.exit(token);
    }
  }

  // ==================== Sync Resolution ====================

  /**
   * Resolve a dependency by token
   *
   * @param token The token to resolve
   * @param optional Whether the dependency is optional
   * @returns The resolved instance
   * @throws {ProviderNotFoundError} if provider not found and not optional
   * @throws {CircularDependencyError} if circular dependency detected
   * @throws {ResolutionError} if resolution fails
   */
  resolve<T = unknown>(token: Token<T>, optional = false): T | undefined {
    const lookup = this.lookupProvider(token, optional);
    if (!lookup) return undefined;

    const { provider, scope } = lookup;
    const context = this.pluginManager
      ? this.createResolutionContext(token, scope, optional)
      : undefined;

    if (this.pluginManager && context) {
      this.pluginManager.executeOnBeforeResolve(token, context);
    }

    // Fast path: return cached instance immediately.
    // This must run BEFORE cycle detection — a cached instance means
    // no circular dependency (e.g. @Autowired property injection cycle).
    const cached = this.resolveFromCache<T>(token, scope, context);
    if (cached !== undefined) return cached;

    // Cache miss: enter cycle detection
    const lazyProxy = this.enterCycleDetection(token);
    if (lazyProxy !== undefined) return lazyProxy;

    this.resolutionStack.push(token);

    try {
      // Resolve based on provider type
      let instance: T;

      if (isValueProvider(provider)) {
        instance = this.resolveValue(provider);
      } else if (isClassProvider(provider)) {
        instance = this.resolveClassInstance(provider, token, scope);
      } else if (isFactoryProvider(provider)) {
        instance = this.resolveFactory(provider, token);
      } else if (isExistingProvider(provider)) {
        instance = this.resolveExisting(provider);
      } else {
        throw new InvalidProviderError("Unknown provider type", token);
      }

      this.cacheAndTrack(token, scope, instance, provider);

      // Call onInit lifecycle hook (sync resolve — async onInit throws)
      if (isClassProvider(provider) && hasOnInit(instance)) {
        if (this.pluginManager && context) {
          this.pluginManager.executeOnBeforeInit(token, instance, context);
        }
        const result = instance.onInit();
        if (result instanceof Promise) {
          throw new AsyncInSyncError(token, "onInit");
        }
        if (this.pluginManager && context) {
          this.pluginManager.executeOnAfterInit(token, instance, context);
        }
      }

      if (this.pluginManager && context) {
        this.pluginManager.executeOnAfterResolve(token, instance, context);
      }

      return instance;
    } catch (error) {
      this.wrapError(error, token, context);
    } finally {
      this.exitResolution(token);
    }
  }

  // ==================== Provider Resolution ====================

  /**
   * Resolve a value provider
   */
  private resolveValue<T>(provider: ValueProvider<T>): T {
    return provider.useValue;
  }

  /**
   * Resolve a class provider with constructor injection
   */
  private resolveClass<T>(provider: ClassProvider<T>): T {
    const target = provider.useClass;

    // Resolve constructor parameters
    const params = ParameterResolver.resolveParameters(target);
    const resolvedParams: unknown[] = [];

    for (const param of params) {
      if (!param.token && param.optional) {
        resolvedParams.push(undefined);
      } else {
        const resolved = this.resolve(param.token!, param.optional);
        resolvedParams.push(resolved);
      }
    }

    try {
      return new target(...resolvedParams);
    } catch (error) {
      throw new InstantiationError(target, error as Error, this.resolutionStack.slice());
    }
  }

  /**
   * Resolve a factory provider
   */
  private resolveFactory<T>(provider: FactoryProvider<T>, token: Token): T {
    const deps: unknown[] = [];
    if (provider.deps) {
      for (const depToken of provider.deps) {
        deps.push(this.resolve(depToken));
      }
    }

    const containerFacade = {
      resolve: <U = unknown>(t: Token<U>) => this.resolve(t) as U,
      resolveOptional: <U = unknown>(t: Token<U>) => this.resolve(t, true),
    };

    try {
      const result = provider.useFactory(containerFacade);

      if (result instanceof Promise) {
        throw new AsyncInSyncError(token, "factory");
      }

      return result;
    } catch (error) {
      if (error instanceof DIError) throw error;
      throw new InstantiationError(
        `factory<${tokenToString(token)}>`,
        error as Error,
        this.resolutionStack.slice(),
      );
    }
  }

  /**
   * Resolve an existing provider (alias)
   */
  private resolveExisting<T = unknown>(provider: ExistingProvider<T>): T {
    return this.resolve(provider.useExisting) as T;
  }

  /**
   * Perform property injection using @Autowired decorator
   */
  private injectProperties(instance: Record<string | symbol, unknown>, target: Constructor): void {
    const autowired = MetadataManager.getAutowired(target);

    if (!autowired || autowired.length === 0) {
      return;
    }

    for (const { propertyKey, token, optional } of autowired) {
      try {
        const resolved = this.resolve(token, optional);
        instance[propertyKey] = resolved;
      } catch (error) {
        if (!optional) {
          if (error instanceof DIError) throw error;
          throw new PropertyInjectionError(target, propertyKey, error as Error);
        }
        // Optional: only silently swallow ProviderNotFoundError.
        // Log a warning for unexpected errors to prevent silent masking of bugs.
        if (!(error instanceof ProviderNotFoundError)) {
          globalLogger.warn(
            `Optional property injection "${String(propertyKey)}" on ${target.name} failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  // ==================== Async Resolution ====================

  /**
   * Async version of resolve for handling async factories
   */
  async resolveAsync<T = unknown>(token: Token<T>, optional = false): Promise<T | undefined> {
    if (this.enableCycleDetection && !this.dependencyGraph.isInAsyncContext()) {
      return this.dependencyGraph.runAsync(() => this.resolveAsyncInner(token, optional));
    }
    return this.resolveAsyncInner(token, optional);
  }

  /**
   * Inner async resolution (always runs inside an async context when cycle detection is enabled)
   */
  private async resolveAsyncInner<T = unknown>(
    token: Token<T>,
    optional = false,
  ): Promise<T | undefined> {
    const lookup = this.lookupProvider(token, optional);
    if (!lookup) return undefined;

    const { provider, scope } = lookup;
    const context = this.pluginManager
      ? this.createResolutionContext(token, scope, optional)
      : undefined;

    if (this.pluginManager && context) {
      this.pluginManager.executeOnBeforeResolve(token, context);
    }

    // Fast path: return cached instance immediately (before cycle detection)
    const cached = this.resolveFromCache<T>(token, scope, context);
    if (cached !== undefined) return cached;

    // Cache miss: enter cycle detection
    const lazyProxy = this.enterCycleDetection(token);
    if (lazyProxy !== undefined) return lazyProxy;

    this.resolutionStack.push(token);

    try {
      let instance: T;

      if (isValueProvider(provider)) {
        instance = this.resolveValue(provider);
      } else if (isClassProvider(provider)) {
        instance = this.resolveClassInstance(provider, token, scope);
      } else if (isFactoryProvider(provider)) {
        instance = await this.resolveFactoryAsync(provider, token);
      } else if (isExistingProvider(provider)) {
        instance = (await this.resolveAsync(provider.useExisting)) as T;
      } else {
        throw new InvalidProviderError("Unknown provider type", token);
      }

      this.cacheAndTrack(token, scope, instance, provider);

      // Call onInit lifecycle hook (async-safe)
      if (isClassProvider(provider) && hasOnInit(instance)) {
        if (this.pluginManager && context) {
          this.pluginManager.executeOnBeforeInit(token, instance, context);
        }
        await instance.onInit();
        if (this.pluginManager && context) {
          this.pluginManager.executeOnAfterInit(token, instance, context);
        }
      }

      if (this.pluginManager && context) {
        this.pluginManager.executeOnAfterResolve(token, instance, context);
      }

      return instance;
    } catch (error) {
      this.wrapError(error, token, context);
    } finally {
      this.exitResolution(token);
    }
  }

  /**
   * Async factory resolution
   */
  private async resolveFactoryAsync<T>(provider: FactoryProvider<T>, token: Token): Promise<T> {
    const deps: unknown[] = [];
    if (provider.deps) {
      for (const depToken of provider.deps) {
        deps.push(await this.resolveAsync(depToken));
      }
    }

    const containerFacade: AsyncFactoryContainer = {
      resolve: <U = unknown>(t: Token<U>) => this.resolveAsync(t) as Promise<U>,
      resolveOptional: <U = unknown>(t: Token<U>) =>
        this.resolveAsync(t, true) as Promise<U | undefined>,
    };

    try {
      const result = provider.useFactory(containerFacade as any);
      return result instanceof Promise ? await result : result;
    } catch (error) {
      if (error instanceof DIError) throw error;
      throw new InstantiationError(
        `factory<${tokenToString(token)}>`,
        error as Error,
        this.resolutionStack.slice(),
      );
    }
  }

  /**
   * Get the current dependency graph (for debugging)
   */
  getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }
}
