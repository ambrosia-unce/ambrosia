/**
 * WebSocket Application
 *
 * Bootstraps WebSocket gateways: processes packs, registers gateways in DI,
 * collects message handlers, and wires them to the WebSocket provider.
 */

import { Container, type Constructor, PackProcessor, Scope } from "@ambrosia-unce/core";
import { WsMetadataManager, GatewayRegistry } from "./metadata/ws-metadata-manager.ts";
import type { WsProvider, WsGatewayConfig } from "./interfaces/ws-provider.ts";
import type { WsClient, WsMessage, WsPackDefinition } from "./types/common.ts";

/**
 * WebSocket application options
 */
export interface WsApplicationOptions {
  /** WebSocket provider instance */
  provider: WsProvider;

  /** Existing DI container (optional — creates a new one if not provided) */
  container?: Container;

  /** Gateway classes to register */
  gateways?: Constructor[];

  /** Packs to load (with optional gateways) */
  packs?: (WsPackDefinition | null | undefined | false)[];
}

/**
 * WebSocket Application
 *
 * @example
 * ```typescript
 * const wsApp = await WsApplication.create({
 *   provider: elysiaWsProvider,
 *   gateways: [ChatGateway, NotificationGateway],
 * });
 * ```
 */
export class WsApplication {
  private container: Container;
  private provider: WsProvider;

  private constructor(
    private options: WsApplicationOptions,
  ) {
    this.container = options.container || new Container();
    this.provider = options.provider;
  }

  /**
   * Create and initialize WebSocket application
   */
  static async create(options: WsApplicationOptions): Promise<WsApplication> {
    const app = new WsApplication(options);
    await app.initialize();
    return app;
  }

  /**
   * Initialize: process packs, register gateways, wire handlers to provider
   */
  private async initialize(): Promise<void> {
    // 1. Process packs
    const packGateways: Constructor[] = [];
    const validPacks = (this.options.packs || []).filter(
      (p): p is WsPackDefinition => !!p,
    );

    if (validPacks.length > 0) {
      const processor = new PackProcessor();
      const result = processor.process(validPacks);
      PackProcessor.registerInContainer(this.container, result.providers);

      for (const pack of validPacks) {
        if (pack.gateways) {
          for (const gw of pack.gateways) {
            if (!packGateways.includes(gw)) {
              packGateways.push(gw);
            }
          }
        }
      }
    }

    // 2. Merge gateways: packs + explicit + GatewayRegistry
    const gatewaySet = new Set<Constructor>([
      ...packGateways,
      ...(this.options.gateways || []),
      ...GatewayRegistry.getAll(),
    ]);

    const gateways = [...gatewaySet];

    // 3. Register gateways in DI
    for (const gateway of gateways) {
      if (!this.container.has(gateway)) {
        this.container.registerClass(gateway, gateway, Scope.SINGLETON);
      }
    }

    // 4. Wire each gateway to the provider
    for (const gatewayClass of gateways) {
      const metadata = WsMetadataManager.getGateway(gatewayClass);
      if (!metadata) continue;

      const messageHandlers = WsMetadataManager.getMessageHandlers(gatewayClass);
      const connectionHandlers = WsMetadataManager.getLifecycleHandlers(gatewayClass, "connection");
      const disconnectionHandlers = WsMetadataManager.getLifecycleHandlers(gatewayClass, "disconnection");

      // Build handler map: event -> method
      const handlerMap = new Map<string, (client: WsClient, data: any) => any>();
      for (const handler of messageHandlers) {
        handlerMap.set(handler.event, (client, data) => {
          const instance = this.container.resolve(gatewayClass);
          return (instance as any)[handler.methodName](client, data);
        });
      }

      const config: WsGatewayConfig = {
        path: metadata.path,

        onConnection: async (client) => {
          for (const handler of connectionHandlers) {
            const instance = this.container.resolve(gatewayClass);
            await (instance as any)[handler.methodName](client);
          }
        },

        onDisconnection: async (client, code, reason) => {
          for (const handler of disconnectionHandlers) {
            const instance = this.container.resolve(gatewayClass);
            await (instance as any)[handler.methodName](client, code, reason);
          }
        },

        onMessage: async (client, message) => {
          const handler = handlerMap.get(message.event);
          if (!handler) return;

          const result = await handler(client, message.data);

          // If handler returns { event, data }, send it back to client
          if (result && typeof result === "object" && "event" in result && "data" in result) {
            client.send(result.event, result.data);
          }

          return result;
        },
      };

      this.provider.registerGateway(config);
    }

    console.log(
      `[Ambrosia WS] Registered ${gateways.length} gateway(s)`,
    );
  }

  /**
   * Get the DI container
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Get the WebSocket provider
   */
  getProvider(): WsProvider {
    return this.provider;
  }

  /**
   * Broadcast to all clients on a gateway path
   */
  broadcast(path: string, event: string, data: any): void {
    this.provider.broadcast(path, event, data);
  }

  /**
   * Get connected clients for a gateway path
   */
  getClients(path: string): Set<WsClient> {
    return this.provider.getClients(path);
  }
}
