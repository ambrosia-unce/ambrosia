/**
 * @SubscribeMessage decorator
 *
 * Subscribes a method to handle a specific WebSocket event.
 */

import type { Constructor } from "@ambrosia-unce/core";
import { WsMetadataManager } from "../metadata/ws-metadata-manager.ts";

/**
 * @SubscribeMessage decorator
 *
 * @param event Event name to subscribe to
 *
 * @example
 * ```typescript
 * @WebSocketGateway("/chat")
 * class ChatGateway {
 *   @SubscribeMessage("sendMessage")
 *   handleMessage(client: WsClient, data: { text: string }) {
 *     // Return value is sent back to the client
 *     return { event: "newMessage", data: { text: data.text, timestamp: Date.now() } };
 *   }
 * }
 * ```
 */
export function SubscribeMessage(event: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;

    WsMetadataManager.addMessageHandler(constructor, {
      event,
      methodName: propertyKey,
    });

    return descriptor;
  };
}
