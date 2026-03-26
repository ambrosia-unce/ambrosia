/**
 * DevTools API Controller
 *
 * REST API endpoints for the DevTools dashboard.
 * All endpoints are under /_devtools/api/.
 */

import { Container, Inject } from "@ambrosia-unce/core";
import {
  Body,
  Controller,
  Http,
  UseGuard,
} from "@ambrosia-unce/http";
import { PackCollector } from "./collectors/pack-collector.ts";
import { DevToolsRouteCollector } from "./collectors/route-collector.ts";
import { DevToolsEventCollector } from "./collectors/event-collector.ts";
import { ConfigCollector } from "./collectors/config-collector.ts";
import { DevToolsLogCollector } from "./collectors/log-collector.ts";
import { PluginRegistry } from "./plugin/plugin-registry.ts";
import { DevToolsGuard } from "./middleware/devtools-guard.ts";
import type {
  DependencyGraphData,
  GraphEdge,
  GraphNode,
  OverviewData,
  TestRouteRequest,
} from "./types.ts";

/** Timestamp when the DevTools was initialized (used for uptime). */
let startTime = Date.now();

@Controller("/_devtools/api")
@UseGuard(DevToolsGuard)
export class DevToolsApiController {
  constructor(
    private readonly container: Container,
    private readonly packCollector: PackCollector,
    private readonly routeCollector: DevToolsRouteCollector,
    private readonly eventCollector: DevToolsEventCollector,
    private readonly configCollector: ConfigCollector,
    private readonly logCollector: DevToolsLogCollector,
    private readonly pluginRegistry: PluginRegistry,
  ) {
    startTime = Date.now();
  }

  /**
   * GET /_devtools/api/overview
   * Returns summary statistics for the dashboard.
   */
  @Http.Get("/overview")
  overview(): OverviewData {
    const packs = this.packCollector.collectPackTree(this.container);
    const routes = this.routeCollector.collectRoutes();
    const events = this.eventCollector.collectEvents(this.container);
    const config = this.configCollector.collectConfig(this.container);
    const diagnostics = this.container.getDiagnostics();

    return {
      totalPacks: packs.totalPacks,
      totalProviders: packs.totalProviders,
      totalRoutes: routes.totalRoutes,
      totalEvents: events.totalEvents,
      totalConfigKeys: config.totalKeys,
      totalPlugins: this.pluginRegistry.getAll().length,
      recentLogs: this.logCollector.getRecentLogs().length,
      logCounts: this.logCollector.getCounts(),
      container: {
        providerCount: diagnostics.providerCount,
        singletonCacheSize: diagnostics.singletonCacheSize,
        requestCacheSize: diagnostics.requestCacheSize,
      },
      uptime: Date.now() - startTime,
    };
  }

  /**
   * GET /_devtools/api/packs
   * Returns the full pack tree.
   */
  @Http.Get("/packs")
  packs() {
    return this.packCollector.collectPackTree(this.container);
  }

  /**
   * GET /_devtools/api/routes
   * Returns the route map.
   */
  @Http.Get("/routes")
  routes() {
    return this.routeCollector.collectRoutes();
  }

  /**
   * GET /_devtools/api/events
   * Returns event handlers and the recent event log.
   */
  @Http.Get("/events")
  events() {
    const eventMap = this.eventCollector.collectEvents(this.container);
    return {
      ...eventMap,
      recentLog: this.eventCollector.getRecentEvents(),
    };
  }

  /**
   * GET /_devtools/api/config
   * Returns config values.
   */
  @Http.Get("/config")
  config() {
    return this.configCollector.collectConfig(this.container);
  }

  /**
   * GET /_devtools/api/logs
   * Returns recent log entries from the LogCollector buffer.
   */
  @Http.Get("/logs")
  logs() {
    return {
      entries: this.logCollector.getRecentLogs(),
      counts: this.logCollector.getCounts(),
      total: this.logCollector.getRecentLogs().length,
    };
  }

  /**
   * GET /_devtools/api/plugins
   * Returns registered plugins and their tabs.
   */
  @Http.Get("/plugins")
  plugins() {
    const allPlugins = this.pluginRegistry.getAll();
    return {
      plugins: allPlugins.map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        hasRoutes: typeof p.registerRoutes === "function",
        hasEvents: typeof p.registerEvents === "function",
        hasTab: !!p.tab,
      })),
      tabs: this.pluginRegistry.getTabs(),
      totalPlugins: allPlugins.length,
    };
  }

  /**
   * GET /_devtools/api/graph
   * Returns dependency graph in nodes + edges format.
   */
  @Http.Get("/graph")
  graph(): DependencyGraphData {
    const packTree = this.packCollector.collectPackTree(this.container);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeSet = new Set<string>();

    for (const pack of packTree.packs) {
      const packId = `pack:${pack.name}`;
      nodes.push({
        id: packId,
        label: pack.name,
        type: "pack",
      });
      nodeSet.add(packId);

      // Pack imports
      for (const imp of pack.imports) {
        edges.push({
          source: packId,
          target: `pack:${imp}`,
          type: "import",
        });
      }

      // Pack providers
      for (const provider of pack.providers) {
        const providerId = `provider:${provider.token}`;
        if (!nodeSet.has(providerId)) {
          nodeSet.add(providerId);
          nodes.push({
            id: providerId,
            label: provider.token,
            type: "provider",
            group: pack.name,
          });
        }
        edges.push({
          source: packId,
          target: providerId,
          type: "provides",
        });
      }

      // Pack controllers
      for (const ctrl of pack.controllers) {
        const ctrlId = `controller:${ctrl}`;
        if (!nodeSet.has(ctrlId)) {
          nodeSet.add(ctrlId);
          nodes.push({
            id: ctrlId,
            label: ctrl,
            type: "controller",
            group: pack.name,
          });
        }
        edges.push({
          source: packId,
          target: ctrlId,
          type: "provides",
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * POST /_devtools/api/test-route
   * Tests a route by making an internal request through the pipeline.
   */
  @Http.Post("/test-route")
  async testRoute(@Body() body: TestRouteRequest) {
    try {
      const port = this.resolvePort();
      const url = `http://localhost:${port}${body.path}`;
      const response = await fetch(url, {
        method: body.method,
        headers: {
          "Content-Type": "application/json",
          ...(body.headers || {}),
        },
        body: body.body ? JSON.stringify(body.body) : undefined,
      });

      const contentType = response.headers.get("content-type") || "";
      let responseBody: unknown;

      if (contentType.includes("application/json")) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      };
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Resolve the server port from config or default.
   */
  private resolvePort(): number {
    try {
      const configService = this.container.resolveOptional<any>(
        (() => {
          try {
            return require("@ambrosia-unce/config").ConfigService;
          } catch {
            return class Placeholder {};
          }
        })(),
      );
      if (configService && typeof configService.get === "function") {
        const port = configService.get("port") as number | undefined;
        if (port) return port;
      }
    } catch {
      // ignore
    }
    return 3000;
  }
}
