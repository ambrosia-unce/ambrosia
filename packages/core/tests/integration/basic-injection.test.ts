/**
 * Basic Injection Integration Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { container, Inject, Injectable, InjectionToken } from "../../src/index.ts";
import { cleanRegistry } from "../helpers/test-helpers.ts";

describe("Basic Injection Integration", () => {
  beforeEach(() => {
    cleanRegistry();
    container.clearAll();
  });

  test("should inject single dependency", () => {
    @Injectable()
    class Logger {
      log(msg: string) {
        return `LOG: ${msg}`;
      }
    }

    @Injectable()
    class UserService {
      constructor(public logger: Logger) {}
    }

    const service = container.resolve<UserService>(UserService);
    expect(service.logger).toBeInstanceOf(Logger);
    expect(service.logger.log("test")).toBe("LOG: test");
  });

  test("should inject multi-level dependencies", () => {
    @Injectable()
    class Database {
      connect() {
        return "connected";
      }
    }

    @Injectable()
    class Repository {
      constructor(public db: Database) {}
    }

    @Injectable()
    class Service {
      constructor(public repo: Repository) {}
    }

    const service = container.resolve<Service>(Service);
    expect(service.repo).toBeInstanceOf(Repository);
    expect(service.repo.db).toBeInstanceOf(Database);
    expect(service.repo.db.connect()).toBe("connected");
  });

  test("should inject multiple dependencies", () => {
    @Injectable()
    class Database {}

    @Injectable()
    class Logger {}

    @Injectable()
    class Cache {}

    @Injectable()
    class UserService {
      constructor(
        public db: Database,
        public logger: Logger,
        public cache: Cache,
      ) {}
    }

    const service = container.resolve<UserService>(UserService);
    expect(service.db).toBeInstanceOf(Database);
    expect(service.logger).toBeInstanceOf(Logger);
    expect(service.cache).toBeInstanceOf(Cache);
  });

  test("should work with InjectionToken", () => {
    interface Config {
      apiUrl: string;
      timeout: number;
    }

    const CONFIG_TOKEN = new InjectionToken<Config>("Config");
    const config: Config = { apiUrl: "https://api.test.com", timeout: 5000 };

    container.registerValue(CONFIG_TOKEN, config);

    @Injectable()
    class ApiClient {
      constructor(@Inject(CONFIG_TOKEN) public config: Config) {}
    }

    const client = container.resolve<ApiClient>(ApiClient);
    expect(client.config).toEqual(config);
    expect(client.config.apiUrl).toBe("https://api.test.com");
  });

  test("should handle complex dependency graph", () => {
    @Injectable()
    class ConfigService {}

    @Injectable()
    class LoggerService {
      constructor(public config: ConfigService) {}
    }

    @Injectable()
    class DatabaseService {
      constructor(
        public config: ConfigService,
        public logger: LoggerService,
      ) {}
    }

    @Injectable()
    class CacheService {
      constructor(public logger: LoggerService) {}
    }

    @Injectable()
    class UserRepository {
      constructor(
        public db: DatabaseService,
        public cache: CacheService,
      ) {}
    }

    @Injectable()
    class UserService {
      constructor(
        public repo: UserRepository,
        public logger: LoggerService,
      ) {}
    }

    const service = container.resolve<UserService>(UserService);

    // Verify full dependency tree
    expect(service.repo).toBeInstanceOf(UserRepository);
    expect(service.repo.db).toBeInstanceOf(DatabaseService);
    expect(service.repo.cache).toBeInstanceOf(CacheService);
    expect(service.logger).toBeInstanceOf(LoggerService);
    expect(service.logger.config).toBeInstanceOf(ConfigService);

    // Singleton: same logger instance should be reused
    expect(service.logger).toBe(service.repo.db.logger);
    expect(service.logger).toBe(service.repo.cache.logger);
  });

  test("should inject same singleton instance everywhere", () => {
    let instanceCount = 0;

    @Injectable()
    class Database {
      id: number;
      constructor() {
        this.id = ++instanceCount;
      }
    }

    @Injectable()
    class ServiceA {
      constructor(public db: Database) {}
    }

    @Injectable()
    class ServiceB {
      constructor(public db: Database) {}
    }

    @Injectable()
    class ServiceC {
      constructor(
        public serviceA: ServiceA,
        public serviceB: ServiceB,
      ) {}
    }

    const serviceC = container.resolve<ServiceC>(ServiceC);

    // All should share the same Database instance
    expect(serviceC.serviceA.db).toBe(serviceC.serviceB.db);
    expect(instanceCount).toBe(1); // Only one instance created
    expect(serviceC.serviceA.db.id).toBe(1);
  });

  test("should handle factory providers with dependencies", () => {
    @Injectable()
    class Config {
      env = "test";
    }

    interface Logger {
      log(msg: string): void;
    }

    const LOGGER_TOKEN = new InjectionToken<Logger>("Logger");

    container.registerFactory(LOGGER_TOKEN, (c) => {
      const config = c.resolve(Config);
      return {
        log(msg: string) {
          console.log(`[${config.env}] ${msg}`);
        },
      };
    });

    @Injectable()
    class UserService {
      constructor(@Inject(LOGGER_TOKEN) public logger: Logger) {}
    }

    const service = container.resolve<UserService>(UserService);
    expect(service.logger).toBeDefined();
    expect(typeof service.logger.log).toBe("function");
  });

  test("should work with real-world service composition", () => {
    // Configuration
    const DB_CONFIG = new InjectionToken<{ host: string; port: number }>("DBConfig");
    container.registerValue(DB_CONFIG, { host: "localhost", port: 5432 });

    // Infrastructure
    @Injectable()
    class Database {
      constructor(@Inject(DB_CONFIG) public _config: { host: string; port: number }) {}
      query(_sql: string) {
        return [{ id: 1, name: "Test" }];
      }
    }

    @Injectable()
    class Logger {
      logs: string[] = [];
      log(msg: string) {
        this.logs.push(msg);
      }
    }

    // Repository Layer
    @Injectable()
    class UserRepository {
      constructor(
        public db: Database,
        public logger: Logger,
      ) {
        this.logger.log("UserRepository initialized");
      }

      findById(id: string) {
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)[0];
      }
    }

    // Service Layer
    @Injectable()
    class UserService {
      constructor(
        public repo: UserRepository,
        public logger: Logger,
      ) {
        this.logger.log("UserService initialized");
      }

      getUser(id: string) {
        this.logger.log(`Getting user ${id}`);
        return this.repo.findById(id);
      }
    }

    // Controller Layer
    @Injectable()
    class UserController {
      constructor(public service: UserService) {}

      handleRequest(userId: string) {
        return this.service.getUser(userId);
      }
    }

    // Resolve and test
    const controller = container.resolve<UserController>(UserController);
    const user = controller.handleRequest("123");

    expect(user).toEqual({ id: 1, name: "Test" });
    expect(controller.service.logger.logs).toContain("UserRepository initialized");
    expect(controller.service.logger.logs).toContain("UserService initialized");
    expect(controller.service.logger.logs).toContain("Getting user 123");
  });
});
