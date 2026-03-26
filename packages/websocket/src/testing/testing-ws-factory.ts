/**
 * Testing utilities for WebSocket gateways
 *
 * MockWsProvider captures registered gateways for unit testing.
 */

import type { Constructor, Token } from "@ambrosia-unce/core";
import type { WsProvider, WsGatewayConfig } from "../interfaces/ws-provider.ts";
import type { WsClient, WsMessage } from "../types/common.ts";
import { WsApplication, type WsApplicationOptions } from "../ws-application.ts";

/**
 * Mock WebSocket client for testing
 */
export class MockWsClient implements WsClient {
  id: string;
  data: Record<string, any> = {};
  sent: Array<{ event: string; data: any }> = [];
  rawSent: Array<string | ArrayBuffer> = [];
  closed = false;
  closeCode?: number;
  closeReason?: string;

  constructor(id = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`) {
    this.id = id;
  }

  send(event: string, data: any): void {
    this.sent.push({ event, data });
  }

  sendRaw(data: string | ArrayBuffer): void {
    this.rawSent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
    this.closeCode = code;
    this.closeReason = reason;
  }
}

/**
 * Mock WebSocket provider for testing
 */
class MockWsProvider implements WsProvider {
  readonly name = "mock";
  private gateways = new Map<string, WsGatewayConfig>();
  private clients = new Map<string, Set<WsClient>>();

  registerGateway(config: WsGatewayConfig): void {
    this.gateways.set(config.path, config);
    this.clients.set(config.path, new Set());
  }

  getClients(path: string): Set<WsClient> {
    return this.clients.get(path) || new Set();
  }

  broadcast(path: string, event: string, data: any): void {
    const clients = this.clients.get(path);
    if (!clients) return;
    for (const client of clients) {
      client.send(event, data);
    }
  }

  /** Simulate a client connecting */
  async simulateConnection(path: string, client: WsClient): Promise<void> {
    const config = this.gateways.get(path);
    if (!config) throw new Error(`No gateway registered for path: ${path}`);
    this.clients.get(path)!.add(client);
    await config.onConnection(client);
  }

  /** Simulate a client disconnecting */
  async simulateDisconnection(path: string, client: WsClient, code = 1000, reason = ""): Promise<void> {
    const config = this.gateways.get(path);
    if (!config) throw new Error(`No gateway registered for path: ${path}`);
    this.clients.get(path)!.delete(client);
    await config.onDisconnection(client, code, reason);
  }

  /** Simulate a message from a client */
  async simulateMessage(path: string, client: WsClient, message: WsMessage): Promise<any> {
    const config = this.gateways.get(path);
    if (!config) throw new Error(`No gateway registered for path: ${path}`);
    return config.onMessage(client, message);
  }

  getGatewayPaths(): string[] {
    return [...this.gateways.keys()];
  }
}

/**
 * TestingWsFactory — creates WebSocket application with mock provider for testing
 *
 * @example
 * ```typescript
 * const module = await TestingWsFactory.create({
 *   gateways: [ChatGateway],
 * }).compile();
 *
 * const client = new MockWsClient("user-1");
 * await module.connect("/chat", client);
 * await module.send("/chat", client, { event: "message", data: { text: "Hello" } });
 *
 * expect(client.sent).toHaveLength(1);
 * await module.disconnect("/chat", client);
 * ```
 */
export class TestingWsFactory {
  private _options: Omit<WsApplicationOptions, "provider">;
  private overrides: Array<{ token: Token; value: any }> = [];

  private constructor(options: Omit<WsApplicationOptions, "provider">) {
    this._options = options;
  }

  static create(options: Omit<WsApplicationOptions, "provider">): TestingWsFactory {
    return new TestingWsFactory(options);
  }

  overrideValue<T>(token: Token<T>, value: T): this {
    this.overrides.push({ token, value });
    return this;
  }

  async compile(): Promise<TestingWsModule> {
    const provider = new MockWsProvider();
    const app = await WsApplication.create({
      ...this._options,
      provider,
    });

    // Apply overrides
    const container = app.getContainer();
    for (const override of this.overrides) {
      container.register({ token: override.token, useValue: override.value });
    }

    return new TestingWsModule(app, provider);
  }
}

/**
 * Compiled testing module with simulate methods
 */
export class TestingWsModule {
  constructor(
    private app: WsApplication,
    private mockProvider: MockWsProvider,
  ) {}

  /** Simulate a client connecting */
  async connect(path: string, client: WsClient): Promise<void> {
    await this.mockProvider.simulateConnection(path, client);
  }

  /** Simulate a client disconnecting */
  async disconnect(path: string, client: WsClient, code?: number, reason?: string): Promise<void> {
    await this.mockProvider.simulateDisconnection(path, client, code, reason);
  }

  /** Simulate a message from a client */
  async send(path: string, client: WsClient, message: WsMessage): Promise<any> {
    return this.mockProvider.simulateMessage(path, client, message);
  }

  /** Get a service from DI */
  get<T extends object>(token: Token<T>): T {
    return this.app.getContainer().resolve(token);
  }

  /** Get registered gateway paths */
  getGatewayPaths(): string[] {
    return this.mockProvider.getGatewayPaths();
  }

  getApp(): WsApplication {
    return this.app;
  }
}
