/**
 * DevTools SSE Controller
 *
 * Server-Sent Events endpoint for live event streaming
 * to the DevTools dashboard.
 */

import { Controller, Http, Sse, SseStream, UseGuard } from "@ambrosia/http";
import { DevToolsEventCollector } from "./collectors/event-collector.ts";
import { PluginRegistry } from "./plugin/plugin-registry.ts";
import { DevToolsGuard } from "./middleware/devtools-guard.ts";

@Controller("/_devtools/api")
@UseGuard(DevToolsGuard)
export class DevToolsSseController {
  constructor(
    private readonly eventCollector: DevToolsEventCollector,
    private readonly pluginRegistry: PluginRegistry,
  ) {}

  /**
   * GET /_devtools/api/sse
   *
   * SSE stream that emits:
   * - http:request — New HTTP requests (method, path, status, timing)
   * - event:emitted — Event bus emissions
   * - plugin:* — Custom plugin events
   */
  @Http.Get("/sse")
  @Sse()
  stream(): SseStream {
    const sse = new SseStream();
    let idCounter = 0;

    /**
     * Callback invoked by the PluginRegistry emitter whenever
     * any event is emitted (from plugins or internal).
     */
    const onEvent = (event: string, data: unknown) => {
      idCounter++;
      sse.send({
        id: String(idCounter),
        event,
        data: data as string | object,
      });

      // Also log the event for the recent events endpoint
      this.eventCollector.logEvent({
        name: event,
        timestamp: Date.now(),
        data,
      });
    };

    // Wire up the plugin registry emitter to forward events to this SSE stream
    this.pluginRegistry.setSseCallback(onEvent);

    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeat = setInterval(() => {
      idCounter++;
      sse.send({
        id: String(idCounter),
        event: "heartbeat",
        data: { timestamp: Date.now() },
      });
    }, 30_000);

    // Clean up when client disconnects
    sse.onClose(() => {
      clearInterval(heartbeat);
      // Remove the SSE callback so no more events are sent
      this.pluginRegistry.setSseCallback(() => {});
    });

    // Send initial connection event
    sse.send({
      event: "connected",
      data: { timestamp: Date.now(), message: "DevTools SSE connected" },
    });

    return sse;
  }
}
