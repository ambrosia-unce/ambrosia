/**
 * WebSocket Metadata Manager
 *
 * Stores and retrieves metadata set by decorators on gateway classes.
 */

import type { Constructor } from "@ambrosia-unce/core";
import type {
  GatewayMetadata,
  LifecycleHandlerMetadata,
  MessageHandlerMetadata,
} from "../types/common.ts";

/**
 * Global registry of gateway classes (populated by @WebSocketGateway decorator)
 */
export class GatewayRegistry {
  private static gateways: Constructor[] = [];

  static register(target: Constructor): void {
    if (!this.gateways.includes(target)) {
      this.gateways.push(target);
    }
  }

  static getAll(): Constructor[] {
    return [...this.gateways];
  }

  static clear(): void {
    this.gateways = [];
  }
}

/**
 * Metadata manager for WebSocket gateways
 */
export class WsMetadataManager {
  // Gateway metadata (class-level)
  private static gatewayMetadata = new Map<Constructor, GatewayMetadata>();

  // Message handlers (method-level)
  private static messageHandlers = new Map<Constructor, MessageHandlerMetadata[]>();

  // Lifecycle handlers (method-level)
  private static lifecycleHandlers = new Map<Constructor, LifecycleHandlerMetadata[]>();

  // ── Gateway ──

  static setGateway(target: Constructor, metadata: GatewayMetadata): void {
    this.gatewayMetadata.set(target, metadata);
  }

  static getGateway(target: Constructor): GatewayMetadata | undefined {
    return this.gatewayMetadata.get(target);
  }

  // ── Message handlers ──

  static addMessageHandler(target: Constructor, handler: MessageHandlerMetadata): void {
    const existing = this.messageHandlers.get(target) || [];
    existing.push(handler);
    this.messageHandlers.set(target, existing);
  }

  static getMessageHandlers(target: Constructor): MessageHandlerMetadata[] {
    return this.messageHandlers.get(target) || [];
  }

  // ── Lifecycle handlers ──

  static addLifecycleHandler(target: Constructor, handler: LifecycleHandlerMetadata): void {
    const existing = this.lifecycleHandlers.get(target) || [];
    existing.push(handler);
    this.lifecycleHandlers.set(target, existing);
  }

  static getLifecycleHandlers(
    target: Constructor,
    type: "connection" | "disconnection",
  ): LifecycleHandlerMetadata[] {
    const all = this.lifecycleHandlers.get(target) || [];
    return all.filter((h) => h.type === type);
  }

  // ── Reset (for testing) ──

  static clear(): void {
    this.gatewayMetadata.clear();
    this.messageHandlers.clear();
    this.lifecycleHandlers.clear();
  }
}
