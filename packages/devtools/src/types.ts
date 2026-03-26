/**
 * Type definitions for @ambrosia-unce/devtools
 */

import type { Container } from "@ambrosia-unce/core";
import type { HttpContext } from "@ambrosia-unce/http";

// ==================== DevTools Options ====================

/**
 * Options for DevToolsPack.forRoot()
 */
export interface DevToolsOptions {
  /**
   * Whether DevTools is enabled.
   * @default process.env.NODE_ENV !== 'production'
   */
  enabled?: boolean;

  /**
   * URL prefix for all DevTools endpoints.
   * @default '/_devtools'
   */
  prefix?: string;

  /**
   * Plugins to register at initialization.
   */
  plugins?: DevToolsPlugin[];

  /**
   * Optional auth token for remote access.
   * If set, the DevTools guard will require this token
   * in the `x-devtools-token` header.
   */
  authToken?: string;
}

// ==================== Plugin System ====================

/**
 * Plugin interface for extending DevTools with custom panels,
 * API routes, and SSE events.
 */
export interface DevToolsPlugin {
  /** Unique plugin ID */
  id: string;
  /** Display name */
  name: string;
  /** Plugin version */
  version: string;

  /** Register custom API routes */
  registerRoutes?(router: DevToolsRouter): void;

  /** Return custom panel data */
  collectData?(container: Container): Promise<Record<string, unknown>>;

  /** Subscribe to SSE events and emit custom events */
  registerEvents?(emitter: DevToolsEventEmitter): void;

  /** Custom UI tab definition */
  tab?: {
    id: string;
    label: string;
    icon?: string;
    /** URL path for the tab's API data */
    dataEndpoint: string;
  };
}

/**
 * Router interface exposed to plugins for registering custom endpoints.
 */
export interface DevToolsRouter {
  get(path: string, handler: (ctx: HttpContext) => unknown): void;
  post(path: string, handler: (ctx: HttpContext) => unknown): void;
}

/**
 * Event emitter interface exposed to plugins for SSE events.
 */
export interface DevToolsEventEmitter {
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
}

/**
 * Tab definition returned to the frontend.
 */
export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  dataEndpoint: string;
  pluginId: string;
}

// ==================== Collector Data Types ====================

/**
 * Data returned by PackCollector.
 */
export interface PackTreeData {
  packs: PackInfo[];
  totalProviders: number;
  totalPacks: number;
}

export interface PackInfo {
  name: string;
  providers: ProviderInfo[];
  exports: string[];
  imports: string[];
  controllers: string[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
  initTime?: number;
}

export interface ProviderInfo {
  token: string;
  scope: string;
  type: string;
}

/**
 * Data returned by RouteCollector.
 */
export interface RouteMapData {
  routes: RouteInfo[];
  totalRoutes: number;
}

export interface RouteInfo {
  method: string;
  path: string;
  controller: string;
  handler: string;
  guards: string[];
  interceptors: string[];
  pipes: string[];
  filters: string[];
  middleware: string[];
  params: RouteParamInfo[];
}

export interface RouteParamInfo {
  type: string;
  name?: string;
  index: number;
}

/**
 * Data returned by EventCollector.
 */
export interface EventMapData {
  events: EventInfo[];
  totalEvents: number;
  totalHandlers: number;
}

export interface EventInfo {
  eventName: string;
  handlers: EventHandlerInfo[];
}

export interface EventHandlerInfo {
  class: string;
  method: string;
  priority: number;
}

/**
 * A single entry in the live event log.
 */
export interface EventLogEntry {
  name: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Data returned by ConfigCollector.
 */
export interface ConfigMapData {
  values: ConfigValueInfo[];
  totalKeys: number;
}

export interface ConfigValueInfo {
  key: string;
  value: unknown;
  type: string;
}

/**
 * Overview summary returned by the /overview endpoint.
 */
export interface OverviewData {
  totalPacks: number;
  totalProviders: number;
  totalRoutes: number;
  totalEvents: number;
  totalConfigKeys: number;
  totalPlugins: number;
  recentLogs: number;
  logCounts: Record<string, number>;
  container: {
    providerCount: number;
    singletonCacheSize: number;
    requestCacheSize: number;
  };
  uptime: number;
}

/**
 * Dependency graph data for visualization.
 */
export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "pack" | "provider" | "controller";
  group?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "import" | "provides" | "depends";
}

/**
 * Request body for the test-route endpoint.
 */
export interface TestRouteRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Custom route handler registered by plugins.
 */
export interface PluginRouteHandler {
  method: "GET" | "POST";
  path: string;
  handler: (ctx: HttpContext) => unknown;
  pluginId: string;
}
