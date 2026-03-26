/**
 * DevToolsPack — main entry point for integrating DevTools
 * into an Ambrosia HTTP application.
 *
 * @example
 * ```typescript
 * import { DevToolsPack } from '@ambrosia/devtools';
 *
 * const app = await HttpApplication.create({
 *   provider: ElysiaProvider,
 *   packs: [
 *     DevToolsPack.forRoot(),
 *     // ... other packs
 *   ],
 * });
 * ```
 */

import { Container, LOGGER_EVENT_BUS, LogEntryEvent } from "@ambrosia/core";
import type { HttpPackDefinition } from "@ambrosia/http";
import { PackCollector } from "./collectors/pack-collector.ts";
import { DevToolsRouteCollector } from "./collectors/route-collector.ts";
import { DevToolsEventCollector } from "./collectors/event-collector.ts";
import { ConfigCollector } from "./collectors/config-collector.ts";
import { DevToolsLogCollector } from "./collectors/log-collector.ts";
import { PluginRegistry } from "./plugin/plugin-registry.ts";
import { DevToolsGuard } from "./middleware/devtools-guard.ts";
import { DevToolsApiController } from "./devtools.api.controller.ts";
import { DevToolsSseController } from "./devtools.sse.controller.ts";
import { DevToolsController } from "./devtools.controller.ts";
import { DEVTOOLS_OPTIONS } from "./tokens.ts";
import type { DevToolsOptions, DevToolsPlugin } from "./types.ts";

/**
 * Default options when none are provided.
 */
const DEFAULT_OPTIONS: DevToolsOptions = {
  enabled: process.env.NODE_ENV !== "production",
  prefix: "/_devtools",
  plugins: [],
};

export class DevToolsPack {
  /**
   * Create the DevTools pack with optional configuration.
   *
   * @param options DevTools configuration
   * @returns HttpPackDefinition that registers all DevTools providers and controllers
   */
  static forRoot(options?: DevToolsOptions): HttpPackDefinition {
    const resolvedOptions: DevToolsOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // If explicitly disabled, return an empty pack (no-op)
    if (resolvedOptions.enabled === false) {
      return {
        meta: { name: "devtools", description: "Ambrosia DevTools (disabled)" },
        providers: [],
      };
    }

    // LogBridge acts as LOGGER_EVENT_BUS — buffers entries until SSE emitter is connected
    const logBridge = {
      collector: null as DevToolsLogCollector | null,
      buffer: [] as any[],
      emit(event: object) {
        if (event instanceof LogEntryEvent) {
          if (this.collector) {
            this.collector.onLog(event.entry);
          } else {
            this.buffer.push(event.entry);
          }
        }
      },
      flush(collector: DevToolsLogCollector) {
        this.collector = collector;
        for (const entry of this.buffer) collector.onLog(entry);
        this.buffer = [];
      },
    };

    return {
      meta: {
        name: "devtools",
        version: "0.1.0",
        description: "Ambrosia DevTools — introspection, live events, and plugin system",
        tags: ["devtools", "debug", "introspection"],
      },

      providers: [
        // Configuration
        { token: DEVTOOLS_OPTIONS, useValue: resolvedOptions },

        // Bridge LoggerService → DevTools (registered early so LoggerService picks it up)
        { token: LOGGER_EVENT_BUS, useValue: logBridge },

        // Collectors
        PackCollector,
        DevToolsRouteCollector,
        DevToolsEventCollector,
        ConfigCollector,
        DevToolsLogCollector,

        // Plugin registry
        PluginRegistry,

        // Guard
        DevToolsGuard,

        // Container will be registered as value provider in onInit
      ],

      exports: [
        DEVTOOLS_OPTIONS,
        LOGGER_EVENT_BUS,
        PackCollector,
        DevToolsRouteCollector,
        DevToolsEventCollector,
        ConfigCollector,
        DevToolsLogCollector,
        PluginRegistry,
        DevToolsGuard,
      ],

      controllers: [
        DevToolsSseController,
        DevToolsApiController,
        DevToolsController,  // catch-all MUST be last
      ],

      async onInit(container) {
        // Register Container itself so controllers can inject it
        container.register({ token: Container, useValue: container });

        const registry = container.resolve(PluginRegistry) as PluginRegistry;

        // Register plugins provided in options
        const plugins = resolvedOptions.plugins || [];
        for (const plugin of plugins) {
          registry.register(plugin);
        }

        // Wire LogCollector emitter and flush buffered entries
        const logCollector = container.resolve(DevToolsLogCollector) as DevToolsLogCollector;
        logCollector.setEmitter(registry.getEmitter());
        logBridge.flush(logCollector);

        console.log(
          `[DevTools] Initialized with ${plugins.length} plugin(s). ` +
            `Dashboard at ${resolvedOptions.prefix || "/_devtools"}`,
        );
      },
    };
  }
}
