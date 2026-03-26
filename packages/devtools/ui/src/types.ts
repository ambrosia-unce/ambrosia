// ── Overview ──────────────────────────────────────────────

export interface OverviewData {
  totalPacks: number;
  totalProviders: number;
  totalRoutes: number;
  totalEvents: number;
  uptime: number;
  startedAt: string;
}

// ── Pack Tree ─────────────────────────────────────────────

export interface PackInfo {
  name: string;
  status: 'initialized' | 'destroyed' | 'pending';
  providers: ProviderInfo[];
  exports: string[];
  imports: string[];
  controllers: string[];
  initTime: number;
  isHttp: boolean;
}

export interface ProviderInfo {
  token: string;
  scope: 'SINGLETON' | 'REQUEST' | 'TRANSIENT';
  type: 'ClassProvider' | 'ValueProvider' | 'FactoryProvider' | 'ExistingProvider';
}

export interface PackTreeData {
  packs: PackInfo[];
}

// ── Routes ────────────────────────────────────────────────

export interface PipelineInfo {
  guards: string[];
  interceptors: string[];
  pipes: string[];
  filters: string[];
  middleware: string[];
}

export interface RouteInfo {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  controller: string;
  handler: string;
  guards: string[];
  interceptors: string[];
  pipes: string[];
  filters: string[];
  middleware: string[];
  params: string[];
}

export interface RouteData {
  routes: RouteInfo[];
}

// ── Events ────────────────────────────────────────────────

export interface EventHandlerInfo {
  eventName: string;
  handlers: string[];
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  eventName: string;
  handlerCount: number;
  data: unknown;
}

export interface EventData {
  handlers: EventHandlerInfo[];
}

// ── Config ────────────────────────────────────────────────

export interface ConfigEntry {
  key: string;
  value: unknown;
  type: string;
}

export interface ConfigData {
  entries: ConfigEntry[];
}

// ── Plugins ───────────────────────────────────────────────

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  tabs: string[];
  status: 'active' | 'inactive' | 'error';
}

// ── Graph (React Flow) ───────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  providerCount: number;
  type: 'core' | 'http' | 'user';
  status: 'initialized' | 'destroyed' | 'pending';
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Logs ─────────────────────────────────────────────────

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: number;
  context?: string;
  data?: unknown;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// ── SSE ──────────────────────────────────────────────────

export interface SSEEvent {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

// ── API Response ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

// ── API Tester ───────────────────────────────────────────

export interface ApiTestRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}
