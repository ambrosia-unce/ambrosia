/**
 * Common WebSocket types
 */

import type { Constructor, PackDefinition } from "@ambrosia-unce/core";

/**
 * WebSocket message payload
 */
export interface WsMessage<T = any> {
  /** Event name */
  event: string;
  /** Message data */
  data: T;
}

/**
 * WebSocket client abstraction
 */
export interface WsClient {
  /** Unique client identifier */
  id: string;
  /** Send a message to this client */
  send(event: string, data: any): void;
  /** Send raw data */
  sendRaw(data: string | ArrayBuffer): void;
  /** Close the connection */
  close(code?: number, reason?: string): void;
  /** Arbitrary data attached to this client */
  data: Record<string, any>;
}

/**
 * WebSocket gateway metadata
 */
export interface GatewayMetadata {
  /** WebSocket path (default: "/") */
  path: string;
  /** Target class */
  target: Constructor;
}

/**
 * Message handler metadata
 */
export interface MessageHandlerMetadata {
  /** Event name to subscribe to */
  event: string;
  /** Method name on the gateway class */
  methodName: string | symbol;
}

/**
 * Lifecycle handler metadata
 */
export interface LifecycleHandlerMetadata {
  /** Lifecycle type */
  type: "connection" | "disconnection";
  /** Method name on the gateway class */
  methodName: string | symbol;
}

/**
 * WebSocket pack definition — extends PackDefinition with gateways
 */
export interface WsPackDefinition extends PackDefinition {
  /** WebSocket gateway classes */
  gateways?: Constructor[];
}
