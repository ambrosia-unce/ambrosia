/**
 * @ambrosia/devtools — DevTools backend for the Ambrosia framework
 *
 * Provides introspection, live event streaming, and a plugin system
 * for building custom DevTools panels.
 *
 * @example
 * ```typescript
 * import { DevToolsPack } from '@ambrosia/devtools';
 * import { HttpApplication } from '@ambrosia/http';
 * import { ElysiaProvider } from '@ambrosia/http-elysia';
 *
 * const app = await HttpApplication.create({
 *   provider: ElysiaProvider,
 *   packs: [
 *     DevToolsPack.forRoot(),
 *   ],
 * });
 *
 * await app.listen(3000);
 * // DevTools available at http://localhost:3000/_devtools
 * ```
 *
 * @module @ambrosia/devtools
 */

import "reflect-metadata";

// Pack
export { DevToolsPack } from "./devtools.pack.ts";

// Tokens
export { DEVTOOLS_OPTIONS, DEVTOOLS_EVENT_EMITTER } from "./tokens.ts";

// Types
export type {
  DevToolsOptions,
  DevToolsPlugin,
  DevToolsRouter,
  DevToolsEventEmitter,
  TabDefinition,
  PluginRouteHandler,
  PackTreeData,
  PackInfo,
  ProviderInfo,
  RouteMapData,
  RouteInfo,
  RouteParamInfo,
  EventMapData,
  EventInfo,
  EventHandlerInfo,
  EventLogEntry,
  ConfigMapData,
  ConfigValueInfo,
  OverviewData,
  DependencyGraphData,
  GraphNode,
  GraphEdge,
  TestRouteRequest,
} from "./types.ts";

// Collectors
export { PackCollector } from "./collectors/pack-collector.ts";
export { DevToolsRouteCollector } from "./collectors/route-collector.ts";
export { DevToolsEventCollector } from "./collectors/event-collector.ts";
export { ConfigCollector } from "./collectors/config-collector.ts";
export { DevToolsLogCollector } from "./collectors/log-collector.ts";
export type { DevToolsLogEntry } from "./collectors/log-collector.ts";

// Plugin system
export { PluginRegistry } from "./plugin/plugin-registry.ts";

// Guard
export { DevToolsGuard } from "./middleware/devtools-guard.ts";

// Controllers (exported for testing and advanced use cases)
export { DevToolsApiController } from "./devtools.api.controller.ts";
export { DevToolsSseController } from "./devtools.sse.controller.ts";
export { DevToolsController } from "./devtools.controller.ts";
