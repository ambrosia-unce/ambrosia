/**
 * WebSocket lifecycle decorators
 *
 * @OnConnection and @OnDisconnection handle client connect/disconnect events.
 */

import type { Constructor } from "@ambrosia-unce/core";
import { WsMetadataManager } from "../metadata/ws-metadata-manager.ts";

/**
 * @OnConnection decorator
 *
 * Called when a new WebSocket client connects.
 *
 * @example
 * ```typescript
 * @WebSocketGateway("/chat")
 * class ChatGateway {
 *   @OnConnection()
 *   handleConnection(client: WsClient) {
 *     console.log(`Client ${client.id} connected`);
 *   }
 * }
 * ```
 */
export function OnConnection(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;

    WsMetadataManager.addLifecycleHandler(constructor, {
      type: "connection",
      methodName: propertyKey,
    });

    return descriptor;
  };
}

/**
 * @OnDisconnection decorator
 *
 * Called when a WebSocket client disconnects.
 *
 * @example
 * ```typescript
 * @WebSocketGateway("/chat")
 * class ChatGateway {
 *   @OnDisconnection()
 *   handleDisconnection(client: WsClient, code: number, reason: string) {
 *     console.log(`Client ${client.id} disconnected: ${code}`);
 *   }
 * }
 * ```
 */
export function OnDisconnection(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;

    WsMetadataManager.addLifecycleHandler(constructor, {
      type: "disconnection",
      methodName: propertyKey,
    });

    return descriptor;
  };
}
