/**
 * @ambrosia/websocket
 *
 * Provider-agnostic WebSocket layer for the Ambrosia framework.
 */

// Decorators
export { WebSocketGateway } from "./decorators/gateway.ts";
export { SubscribeMessage } from "./decorators/subscribe.ts";
export { OnConnection, OnDisconnection } from "./decorators/lifecycle.ts";

// Interfaces
export type { WsProvider, WsGatewayConfig } from "./interfaces/ws-provider.ts";

// Types
export type {
  WsClient,
  WsMessage,
  GatewayMetadata,
  MessageHandlerMetadata,
  LifecycleHandlerMetadata,
  WsPackDefinition,
} from "./types/common.ts";

// Application
export { WsApplication, type WsApplicationOptions } from "./ws-application.ts";

// Metadata (for adapter authors and testing)
export { WsMetadataManager, GatewayRegistry } from "./metadata/ws-metadata-manager.ts";

// Testing
export {
  TestingWsFactory,
  TestingWsModule,
  MockWsClient,
} from "./testing/testing-ws-factory.ts";
