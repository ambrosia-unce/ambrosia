/**
 * @WebSocketGateway decorator
 *
 * Marks a class as a WebSocket gateway and registers it with DI.
 */

import { type Constructor, Injectable } from "@ambrosia/core";
import { GatewayRegistry, WsMetadataManager } from "../metadata/ws-metadata-manager.ts";

/**
 * @WebSocketGateway decorator
 *
 * @param path WebSocket path (default: "/ws")
 *
 * @example
 * ```typescript
 * @WebSocketGateway("/chat")
 * class ChatGateway {
 *   @SubscribeMessage("message")
 *   handleMessage(client: WsClient, data: any) {
 *     return { event: "message", data: { echo: data } };
 *   }
 * }
 * ```
 */
export function WebSocketGateway(path = "/ws"): ClassDecorator {
  return <T extends Function>(target: T): T => {
    const constructor = target as unknown as Constructor;

    // Normalize path
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Store metadata
    WsMetadataManager.setGateway(constructor, {
      path: normalizedPath,
      target: constructor,
    });

    // Register in global registry
    GatewayRegistry.register(constructor);

    // Auto-apply @Injectable
    if (!Reflect.hasMetadata("ambrosia:injectable", constructor)) {
      Injectable()(target);
    }

    return target;
  };
}
