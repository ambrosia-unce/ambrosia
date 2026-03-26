/**
 * PluginRegistry — manages DevTools plugins.
 *
 * Plugins can register custom API routes, SSE events, and UI tabs.
 * The registry is populated during DevToolsPack onInit and is
 * immutable after initialization.
 */

import { Injectable } from "@ambrosia-unce/core";
import type {
  DevToolsEventEmitter,
  DevToolsPlugin,
  DevToolsRouter,
  PluginRouteHandler,
  TabDefinition,
} from "../types.ts";

/**
 * Internal router implementation passed to plugins.
 */
class PluginRouter implements DevToolsRouter {
  readonly routes: PluginRouteHandler[] = [];

  constructor(private pluginId: string) {}

  get(path: string, handler: (ctx: any) => unknown): void {
    this.routes.push({ method: "GET", path, handler, pluginId: this.pluginId });
  }

  post(path: string, handler: (ctx: any) => unknown): void {
    this.routes.push({ method: "POST", path, handler, pluginId: this.pluginId });
  }
}

/**
 * Internal event emitter implementation passed to plugins.
 */
class PluginEventEmitter implements DevToolsEventEmitter {
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();
  private sseCallback: ((event: string, data: unknown) => void) | null = null;

  emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
    if (this.sseCallback) {
      this.sseCallback(event, data);
    }
  }

  on(event: string, handler: (data: unknown) => void): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = [];
      this.listeners.set(event, handlers);
    }
    handlers.push(handler);
  }

  setSseCallback(callback: (event: string, data: unknown) => void): void {
    this.sseCallback = callback;
  }
}

@Injectable()
export class PluginRegistry {
  private plugins: Map<string, DevToolsPlugin> = new Map();
  private customRoutes: PluginRouteHandler[] = [];
  private emitter = new PluginEventEmitter();

  /**
   * Register a plugin. Called during DevToolsPack onInit.
   */
  register(plugin: DevToolsPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[DevTools] Plugin "${plugin.id}" is already registered. Skipping.`);
      return;
    }

    this.plugins.set(plugin.id, plugin);

    // Let plugin register custom routes
    if (plugin.registerRoutes) {
      const router = new PluginRouter(plugin.id);
      plugin.registerRoutes(router);
      this.customRoutes.push(...router.routes);
    }

    // Let plugin register SSE event subscriptions
    if (plugin.registerEvents) {
      plugin.registerEvents(this.emitter);
    }
  }

  /**
   * Get all registered plugins.
   */
  getAll(): DevToolsPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a plugin by ID.
   */
  getPlugin(id: string): DevToolsPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all tab definitions from plugins.
   */
  getTabs(): TabDefinition[] {
    const tabs: TabDefinition[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.tab) {
        tabs.push({
          ...plugin.tab,
          pluginId: plugin.id,
        });
      }
    }
    return tabs;
  }

  /**
   * Get all custom routes registered by plugins.
   */
  getCustomRoutes(): PluginRouteHandler[] {
    return this.customRoutes;
  }

  /**
   * Get the shared event emitter.
   * Used by SSE controller and collectors to emit/subscribe to events.
   */
  getEmitter(): DevToolsEventEmitter {
    return this.emitter;
  }

  /**
   * Set a callback that forwards all emitted events to SSE clients.
   */
  setSseCallback(callback: (event: string, data: unknown) => void): void {
    this.emitter.setSseCallback(callback);
  }
}
