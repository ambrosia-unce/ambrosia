/**
 * Test Fixtures - Reusable test classes and tokens
 */
import "reflect-metadata";
import { InjectionToken } from "../../src/types/token.ts";
/**
 * Test Database service
 */
export declare class TestDatabase {
  connected: boolean;
  connect(): void;
  disconnect(): void;
  query(sql: string): any[];
}
/**
 * Test Logger service
 */
export declare class TestLogger {
  logs: string[];
  log(message: string): void;
  getLogs(): string[];
  clear(): void;
}
/**
 * Test Cache service
 */
export declare class TestCache {
  private cache;
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  clear(): void;
}
/**
 * User service with database dependency
 */
export declare class TestUserService {
  db: TestDatabase;
  logger: TestLogger;
  constructor(db: TestDatabase, logger: TestLogger);
  getUser(id: string): {
    id: string;
    name: string;
  };
}
/**
 * Singleton service for scope testing
 */
export declare class SingletonService {
  id: string;
  createdAt: number;
  getId(): string;
}
/**
 * Transient service for scope testing
 */
export declare class TransientService {
  id: string;
  createdAt: number;
  getId(): string;
}
/**
 * Request-scoped service for scope testing
 */
export declare class RequestScopedService {
  id: string;
  requestId: string;
  setRequestId(id: string): void;
  getRequestId(): string;
}
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
export declare const TEST_CONFIG: InjectionToken<TestConfig>;
/**
 * API Key token
 */
export declare const API_KEY_TOKEN: InjectionToken<string>;
/**
 * Max Connections token
 */
export declare const MAX_CONNECTIONS: InjectionToken<number>;
export declare const DEFAULT_TEST_CONFIG: TestConfig;
//# sourceMappingURL=fixtures.d.ts.map
