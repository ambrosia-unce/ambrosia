/**
 * Plugin Manager
 *
 * Manages plugin registration and execution
 */

import type { IContainer } from "../interfaces";
import type { Provider, Token } from "../types";
import { globalLogger } from "../utils/logger.ts";
import type { Plugin, PrioritizedPlugin, ResolutionContext } from "./types.ts";
import { PluginPriority } from "./types.ts";

/**
 * Plugin Manager class
 * Coordinates plugin lifecycle and hook execution
 */
export class PluginManager {
  /**
   * Registered plugins with priorities
   */
  private plugins: PrioritizedPlugin[] = [];

  /**
   * Register a plugin
   *
   * @param plugin The plugin to register
   * @param priority Plugin execution priority
   */
  register(plugin: Plugin, priority: PluginPriority = PluginPriority.NORMAL): void {
    // Check if plugin with same name already exists
    const existingIdx = this.plugins.findIndex((p) => p.plugin.name === plugin.name);
    if (existingIdx !== -1) {
      globalLogger.warn(
        `Plugin "${plugin.name}" is already registered. ` +
          `This will replace the existing plugin.`,
      );
      this.plugins.splice(existingIdx, 1);
    }

    // Binary insertion to maintain descending priority order (O(log n) instead of O(n log n))
    const entry: PrioritizedPlugin = { plugin, priority };
    let lo = 0;
    let hi = this.plugins.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.plugins[mid]!.priority >= priority) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this.plugins.splice(lo, 0, entry);
  }

  /**
   * Unregister a plugin by name
   *
   * @param pluginName The name of the plugin to remove
   * @returns true if plugin was removed
   */
  unregister(pluginName: string): boolean {
    const initialLength = this.plugins.length;
    this.plugins = this.plugins.filter((p) => p.plugin.name !== pluginName);
    return this.plugins.length < initialLength;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return this.plugins.map((p) => p.plugin);
  }

  /**
   * Check if a plugin is registered
   *
   * @param pluginName The name of the plugin
   */
  hasPlugin(pluginName: string): boolean {
    return this.plugins.some((p) => p.plugin.name === pluginName);
  }

  // ==================== Hook Execution ====================

  /**
   * Execute onContainerCreate hook
   */
  executeOnContainerCreate(container: IContainer): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onContainerCreate?.(container);
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onContainerCreate:`, error);
      }
    }
  }

  /**
   * Execute onBeforeResolve hook
   */
  executeOnBeforeResolve(token: Token, context: ResolutionContext): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onBeforeResolve?.(token, context);
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onBeforeResolve:`, error);
      }
    }
  }

  /**
   * Execute onAfterResolve hook
   */
  executeOnAfterResolve(token: Token, instance: unknown, context: ResolutionContext): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onAfterResolve?.(token, instance, context);
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onAfterResolve:`, error);
      }
    }
  }

  /**
   * Execute onBeforeInit hook
   */
  executeOnBeforeInit(token: Token, instance: unknown, context: ResolutionContext): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onBeforeInit?.(token, instance, context);
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onBeforeInit:`, error);
      }
    }
  }

  /**
   * Execute onAfterInit hook
   */
  executeOnAfterInit(token: Token, instance: unknown, context: ResolutionContext): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onAfterInit?.(token, instance, context);
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onAfterInit:`, error);
      }
    }
  }

  /**
   * Execute onError hook
   */
  executeOnError(error: Error, context: ResolutionContext): void {
    for (const { plugin } of this.plugins) {
      try {
        plugin.onError?.(error, context);
      } catch (pluginError) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onError hook:`, pluginError);
      }
    }
  }

  /**
   * Execute onRegisterProvider hook
   * Returns the transformed provider
   */
  executeOnRegisterProvider(provider: Provider): Provider {
    let transformedProvider = provider;

    for (const { plugin } of this.plugins) {
      try {
        if (plugin.onRegisterProvider) {
          transformedProvider = plugin.onRegisterProvider(transformedProvider);
        }
      } catch (error) {
        globalLogger.error(`Plugin "${plugin.name}" threw error in onRegisterProvider:`, error);
        // Continue with untransformed provider on error
      }
    }

    return transformedProvider;
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins = [];
  }

  /**
   * Get plugin count
   */
  get size(): number {
    return this.plugins.length;
  }
}
