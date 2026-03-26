/**
 * WebSocket Gateway integration tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Injectable } from "@ambrosia-unce/core";
import {
  WebSocketGateway,
  SubscribeMessage,
  OnConnection,
  OnDisconnection,
  TestingWsFactory,
  MockWsClient,
  GatewayRegistry,
  WsMetadataManager,
} from "../src/index.ts";
import type { WsClient } from "../src/index.ts";

// ==================== Test Gateways ====================

@Injectable()
class ChatService {
  private messages: string[] = [];

  addMessage(text: string): void {
    this.messages.push(text);
  }

  getMessages(): string[] {
    return [...this.messages];
  }
}

@WebSocketGateway("/chat")
class ChatGateway {
  private connectedClients: string[] = [];

  constructor(private chatService: ChatService) {}

  @OnConnection()
  handleConnection(client: WsClient) {
    this.connectedClients.push(client.id);
  }

  @OnDisconnection()
  handleDisconnection(client: WsClient) {
    this.connectedClients = this.connectedClients.filter((id) => id !== client.id);
  }

  @SubscribeMessage("sendMessage")
  handleMessage(client: WsClient, data: { text: string }) {
    this.chatService.addMessage(data.text);
    return { event: "newMessage", data: { from: client.id, text: data.text } };
  }

  @SubscribeMessage("getHistory")
  handleGetHistory() {
    return { event: "history", data: this.chatService.getMessages() };
  }

  getConnectedClients(): string[] {
    return this.connectedClients;
  }
}

@WebSocketGateway("/notifications")
class NotificationGateway {
  @SubscribeMessage("subscribe")
  handleSubscribe(client: WsClient, data: { channel: string }) {
    client.data.channel = data.channel;
    return { event: "subscribed", data: { channel: data.channel } };
  }
}

// ==================== Tests ====================

describe("WebSocket Gateway", () => {
  beforeEach(() => {
    // Only clear registry (auto-discovery), not metadata (set once by decorators)
    GatewayRegistry.clear();
  });

  describe("Decorators", () => {
    test("@WebSocketGateway registers gateway metadata", () => {
      @WebSocketGateway("/test")
      class TestGw {}

      const metadata = WsMetadataManager.getGateway(TestGw as any);
      expect(metadata).toBeDefined();
      expect(metadata!.path).toBe("/test");
    });

    test("@WebSocketGateway defaults to /ws", () => {
      @WebSocketGateway()
      class DefaultGw {}

      const metadata = WsMetadataManager.getGateway(DefaultGw as any);
      expect(metadata!.path).toBe("/ws");
    });

    test("@SubscribeMessage registers message handler", () => {
      @WebSocketGateway()
      class MsgGw {
        @SubscribeMessage("test-event")
        handle() {}
      }

      const handlers = WsMetadataManager.getMessageHandlers(MsgGw as any);
      expect(handlers).toHaveLength(1);
      expect(handlers[0].event).toBe("test-event");
      expect(handlers[0].methodName).toBe("handle");
    });

    test("@OnConnection registers lifecycle handler", () => {
      @WebSocketGateway()
      class ConnGw {
        @OnConnection()
        onConn() {}
      }

      const handlers = WsMetadataManager.getLifecycleHandlers(ConnGw as any, "connection");
      expect(handlers).toHaveLength(1);
    });

    test("@OnDisconnection registers lifecycle handler", () => {
      @WebSocketGateway()
      class DisconnGw {
        @OnDisconnection()
        onDisconn() {}
      }

      const handlers = WsMetadataManager.getLifecycleHandlers(DisconnGw as any, "disconnection");
      expect(handlers).toHaveLength(1);
    });
  });

  describe("TestingWsFactory", () => {
    test("creates module with gateway", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const paths = module.getGatewayPaths();
      expect(paths).toContain("/chat");
    });

    test("multiple gateways", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway, NotificationGateway],
      }).compile();

      const paths = module.getGatewayPaths();
      expect(paths).toContain("/chat");
      expect(paths).toContain("/notifications");
    });
  });

  describe("Connection lifecycle", () => {
    test("@OnConnection handler is called on connect", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const client = new MockWsClient("user-1");
      await module.connect("/chat", client);

      const gateway = module.get(ChatGateway);
      expect(gateway.getConnectedClients()).toContain("user-1");
    });

    test("@OnDisconnection handler is called on disconnect", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const client = new MockWsClient("user-2");
      await module.connect("/chat", client);
      await module.disconnect("/chat", client);

      const gateway = module.get(ChatGateway);
      expect(gateway.getConnectedClients()).not.toContain("user-2");
    });
  });

  describe("Message handling", () => {
    test("@SubscribeMessage routes events to handler", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const client = new MockWsClient("user-3");
      await module.connect("/chat", client);

      await module.send("/chat", client, {
        event: "sendMessage",
        data: { text: "Hello world" },
      });

      // Handler returns { event, data } which is auto-sent to client
      expect(client.sent).toHaveLength(1);
      expect(client.sent[0].event).toBe("newMessage");
      expect(client.sent[0].data.text).toBe("Hello world");
      expect(client.sent[0].data.from).toBe("user-3");
    });

    test("message handler uses DI service", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const client = new MockWsClient("user-4");
      await module.connect("/chat", client);

      await module.send("/chat", client, {
        event: "sendMessage",
        data: { text: "First message" },
      });

      await module.send("/chat", client, {
        event: "sendMessage",
        data: { text: "Second message" },
      });

      // Service should have accumulated messages
      const chatService = module.get(ChatService);
      expect(chatService.getMessages()).toEqual(["First message", "Second message"]);
    });

    test("unsubscribed events are ignored", async () => {
      const module = await TestingWsFactory.create({
        gateways: [ChatGateway],
      }).compile();

      const client = new MockWsClient("user-5");
      await module.connect("/chat", client);

      await module.send("/chat", client, {
        event: "unknownEvent",
        data: {},
      });

      expect(client.sent).toHaveLength(0);
    });

    test("client data persists across messages", async () => {
      const module = await TestingWsFactory.create({
        gateways: [NotificationGateway],
      }).compile();

      const client = new MockWsClient("user-6");
      await module.connect("/notifications", client);

      await module.send("/notifications", client, {
        event: "subscribe",
        data: { channel: "news" },
      });

      expect(client.data.channel).toBe("news");
      expect(client.sent[0].event).toBe("subscribed");
    });
  });

  describe("MockWsClient", () => {
    test("tracks sent messages", () => {
      const client = new MockWsClient();
      client.send("test", { value: 1 });
      client.send("test2", { value: 2 });

      expect(client.sent).toHaveLength(2);
      expect(client.sent[0]).toEqual({ event: "test", data: { value: 1 } });
    });

    test("tracks close", () => {
      const client = new MockWsClient();
      expect(client.closed).toBe(false);

      client.close(1000, "normal");
      expect(client.closed).toBe(true);
      expect(client.closeCode).toBe(1000);
    });

    test("tracks raw sent data", () => {
      const client = new MockWsClient();
      client.sendRaw("raw data");
      expect(client.rawSent).toHaveLength(1);
    });
  });
});
