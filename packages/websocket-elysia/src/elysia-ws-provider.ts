/**
 * Elysia WebSocket Provider
 *
 * Implements WsProvider using Elysia's built-in WebSocket support.
 * Designed to be used alongside ElysiaProvider for HTTP.
 */

import type { Elysia } from "elysia";
import type { WsProvider, WsGatewayConfig, WsClient, WsMessage } from "@ambrosia-unce/websocket";

let clientIdCounter = 0;

/**
 * Creates a WsClient wrapper around an Elysia WebSocket
 */
function createWsClient(ws: any): WsClient {
  const id = `ws-${++clientIdCounter}-${Date.now().toString(36)}`;
  const clientData: Record<string, any> = {};

  return {
    id,
    data: clientData,

    send(event: string, data: any): void {
      try {
        ws.send(JSON.stringify({ event, data }));
      } catch {
        // Client may have disconnected
      }
    },

    sendRaw(data: string | ArrayBuffer): void {
      try {
        ws.send(data);
      } catch {
        // Client may have disconnected
      }
    },

    close(code?: number, reason?: string): void {
      ws.close(code, reason);
    },
  };
}

/**
 * ElysiaWsProvider
 *
 * Bridges @ambrosia-unce/websocket to Elysia's WebSocket support.
 *
 * @example
 * ```typescript
 * import { Elysia } from "elysia";
 * import { ElysiaWsProvider } from "@ambrosia-unce/websocket-elysia";
 *
 * const elysia = new Elysia();
 * const wsProvider = new ElysiaWsProvider(elysia);
 *
 * const wsApp = await WsApplication.create({
 *   provider: wsProvider,
 *   gateways: [ChatGateway],
 * });
 *
 * elysia.listen(3000);
 * ```
 */
export class ElysiaWsProvider implements WsProvider {
  readonly name = "elysia-ws";
  private clientMap = new Map<string, Map<string, WsClient>>(); // path -> (clientId -> WsClient)

  constructor(private app: Elysia<any>) {}

  registerGateway(config: WsGatewayConfig): void {
    const clientsForPath = new Map<string, WsClient>();
    this.clientMap.set(config.path, clientsForPath);

    // Map of ws object -> WsClient (to find the WsClient from Elysia's ws object)
    const wsToClient = new WeakMap<object, WsClient>();

    this.app.ws(config.path, {
      open: async (ws: any) => {
        const client = createWsClient(ws);
        wsToClient.set(ws, client);
        clientsForPath.set(client.id, client);

        try {
          await config.onConnection(client);
        } catch (err) {
          console.error(`[Ambrosia WS] Error in onConnection for ${config.path}:`, err);
        }
      },

      close: async (ws: any, code: number, reason: string) => {
        const client = wsToClient.get(ws);
        if (!client) return;

        clientsForPath.delete(client.id);
        wsToClient.delete(ws);

        try {
          await config.onDisconnection(client, code, reason || "");
        } catch (err) {
          console.error(`[Ambrosia WS] Error in onDisconnection for ${config.path}:`, err);
        }
      },

      message: async (ws: any, rawMessage: any) => {
        const client = wsToClient.get(ws);
        if (!client) return;

        let message: WsMessage;
        try {
          if (typeof rawMessage === "string") {
            message = JSON.parse(rawMessage);
          } else if (rawMessage instanceof Buffer || rawMessage instanceof ArrayBuffer) {
            message = JSON.parse(new TextDecoder().decode(rawMessage));
          } else if (typeof rawMessage === "object") {
            message = rawMessage as WsMessage;
          } else {
            return; // Unknown format
          }
        } catch {
          // Not valid JSON — ignore
          return;
        }

        if (!message.event) return;

        try {
          await config.onMessage(client, message);
        } catch (err) {
          console.error(`[Ambrosia WS] Error handling message "${message.event}" on ${config.path}:`, err);
        }
      },
    });
  }

  getClients(path: string): Set<WsClient> {
    const clients = this.clientMap.get(path);
    if (!clients) return new Set();
    return new Set(clients.values());
  }

  broadcast(path: string, event: string, data: any): void {
    const clients = this.clientMap.get(path);
    if (!clients) return;

    const payload = JSON.stringify({ event, data });
    for (const client of clients.values()) {
      client.sendRaw(payload);
    }
  }
}
