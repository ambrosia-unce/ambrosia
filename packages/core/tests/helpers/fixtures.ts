/**
 * Test Fixtures - Reusable test classes and tokens
 */

import "reflect-metadata";
import { Injectable } from "../../src/decorators/injectable.ts";
import { Scope } from "../../src/scope/types.ts";
import { InjectionToken } from "../../src/types/token.ts";

// ==================== Basic Test Services ====================

/**
 * Test Database service
 */
@Injectable()
export class TestDatabase {
  connected = false;

  connect(): void {
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
  }

  query(sql: string): any[] {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    return [{ id: 1, data: sql }];
  }
}

/**
 * Test Logger service
 */
@Injectable()
export class TestLogger {
  logs: string[] = [];

  log(message: string): void {
    this.logs.push(message);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Test Cache service
 */
@Injectable()
export class TestCache {
  private cache = new Map<string, any>();

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ==================== Services with Dependencies ====================

/**
 * User service with database dependency
 */
@Injectable()
export class TestUserService {
  constructor(
    public db: TestDatabase,
    public logger: TestLogger,
  ) {
    this.logger.log("TestUserService initialized");
  }

  getUser(id: string): { id: string; name: string } {
    this.db.connect();
    this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return { id, name: "Test User" };
  }
}

// ==================== Scope Test Classes ====================

/**
 * Singleton service for scope testing
 */
@Injectable({ scope: Scope.SINGLETON })
export class SingletonService {
  id: string = Math.random().toString(36);
  createdAt: number = Date.now();

  getId(): string {
    return this.id;
  }
}

/**
 * Transient service for scope testing
 */
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  id: string = Math.random().toString(36);
  createdAt: number = Date.now();

  getId(): string {
    return this.id;
  }
}

/**
 * Request-scoped service for scope testing
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  id: string = Math.random().toString(36);
  requestId: string = "";

  setRequestId(id: string): void {
    this.requestId = id;
  }

  getRequestId(): string {
    return this.requestId;
  }
}

// ==================== Injection Tokens ====================

/**
 * Config interface
 */
export interface TestConfig {
  apiUrl: string;
  port: number;
  debug?: boolean;
}

/**
 * Config token
 */
export const TEST_CONFIG = new InjectionToken<TestConfig>("TestConfig");

/**
 * API Key token
 */
export const API_KEY_TOKEN = new InjectionToken<string>("ApiKey");

/**
 * Max Connections token
 */
export const MAX_CONNECTIONS = new InjectionToken<number>("MaxConnections");

// ==================== Default Config Values ====================

export const DEFAULT_TEST_CONFIG: TestConfig = {
  apiUrl: "https://test-api.example.com",
  port: 3000,
  debug: true,
};
