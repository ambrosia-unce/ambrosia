/**
 * WebSocket Provider Interface
 *
 * Adapters (Elysia, Bun.serve, etc.) implement this interface
 * to provide WebSocket functionality to the framework.
 */

import type { WsClient, WsMessage } from "../types/common.ts";

/**
 * Configuration for registering a WebSocket gateway
 */
export interface WsGatewayConfig {
  /** WebSocket path */
  path: string;
  /** Called when a client connects */
  onConnection: (client: WsClient) => void | Promise<void>;
  /** Called when a client disconnects */
  onDisconnection: (client: WsClient, code: number, reason: string) => void | Promise<void>;
  /** Called when a message is received */
  onMessage: (client: WsClient, message: WsMessage) => any | Promise<any>;
}

/**
 * WebSocket Provider interface
 *
 * Implement this to add WebSocket support for a specific HTTP server.
 */
export interface WsProvider {
  /** Provider name */
  readonly name: string;

  /**
   * Register a WebSocket gateway
   *
   * @param config Gateway configuration with handlers
   */
  registerGateway(config: WsGatewayConfig): void;

  /**
   * Get all connected clients for a gateway path
   *
   * @param path Gateway path
   * @returns Set of connected clients
   */
  getClients(path: string): Set<WsClient>;

  /**
   * Broadcast a message to all clients on a gateway path
   *
   * @param path Gateway path
   * @param event Event name
   * @param data Message data
   */
  broadcast(path: string, event: string, data: any): void;
}
