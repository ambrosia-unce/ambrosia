/**
 * @Autowired Decorator Unit Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../../src/container/container.ts";
import { Autowired } from "../../../src/decorators/autowired.ts";
import { Inject } from "../../../src/decorators/inject.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { Optional } from "../../../src/decorators/optional.ts";
import { MetadataManager } from "../../../src/metadata/metadata-manager.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import { cleanRegistry, createTestContainer } from "../../helpers/test-helpers.ts";

describe("@Autowired", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  test("should inject property from inferred type", () => {
    @Injectable()
    class Logger {
      message = "hello";
    }

    @Injectable()
    class AppService {
      @Autowired()
      logger!: Logger;
    }

    const container = new Container(true);
    const service = container.resolve<AppService>(AppService);

    expect(service.logger).toBeInstanceOf(Logger);
    expect(service.logger.message).toBe("hello");
  });

  test("should inject with explicit token", () => {
    @Injectable()
    class Database {
      name = "postgres";
    }

    const DB_TOKEN = new InjectionToken("Database");

    @Injectable()
    class Repository {
      @Autowired(DB_TOKEN)
      db!: Database;
    }

    const container = createTestContainer();
    container.registerClass(DB_TOKEN, Database);
    container.registerClass(Repository, Repository);
    const repo = container.resolve<Repository>(Repository);

    expect(repo.db).toBeInstanceOf(Database);
    expect(repo.db.name).toBe("postgres");
  });

  test("should not throw with @Optional when provider is missing", () => {
    @Injectable()
    class CacheService {
      hit = true;
    }

    @Injectable()
    class AppService {
      @Autowired()
      @Optional()
      cache?: CacheService;
    }

    const container = createTestContainer();
    container.registerClass(AppService, AppService);
    // Note: CacheService is NOT registered
    const service = container.resolve<AppService>(AppService);

    expect(service.cache).toBeUndefined();
  });

  test("should inject with @Optional when provider exists", () => {
    @Injectable()
    class CacheService {
      hit = true;
    }

    @Injectable()
    class AppService {
      @Autowired()
      @Optional()
      cache?: CacheService;
    }

    const container = new Container(true);
    const service = container.resolve<AppService>(AppService);

    expect(service.cache).toBeInstanceOf(CacheService);
    expect(service.cache!.hit).toBe(true);
  });

  test("should inject multiple @Autowired properties on one class", () => {
    @Injectable()
    class Logger {
      level = "info";
    }

    @Injectable()
    class Database {
      connected = true;
    }

    @Injectable()
    class Config {
      port = 3000;
    }

    @Injectable()
    class AppService {
      @Autowired()
      logger!: Logger;

      @Autowired()
      db!: Database;

      @Autowired()
      config!: Config;
    }

    const container = new Container(true);
    const service = container.resolve<AppService>(AppService);

    expect(service.logger).toBeInstanceOf(Logger);
    expect(service.logger.level).toBe("info");
    expect(service.db).toBeInstanceOf(Database);
    expect(service.db.connected).toBe(true);
    expect(service.config).toBeInstanceOf(Config);
    expect(service.config.port).toBe(3000);
  });

  test("should break circular dependency with @Autowired", () => {
    const A_TOKEN = new InjectionToken("A");
    const B_TOKEN = new InjectionToken("B");

    @Injectable()
    class ServiceA {
      @Autowired(B_TOKEN)
      b!: any;
    }

    @Injectable()
    class ServiceB {
      constructor(@Inject(A_TOKEN) public a: any) {}
    }

    const container = createTestContainer();
    container.registerClass(A_TOKEN, ServiceA);
    container.registerClass(B_TOKEN, ServiceB);
    const a = container.resolve<ServiceA>(A_TOKEN);

    expect(a).toBeInstanceOf(ServiceA);
    expect(a.b).toBeInstanceOf(ServiceB);
    expect(a.b.a).toBeInstanceOf(ServiceA);
    expect(a.b.a).toBe(a);
  });

  test("should inject with InjectionToken", () => {
    const CONFIG_TOKEN = new InjectionToken<{ apiUrl: string }>("Config");

    @Injectable()
    class ApiClient {
      @Autowired(CONFIG_TOKEN)
      config!: { apiUrl: string };
    }

    const container = createTestContainer();
    container.registerValue(CONFIG_TOKEN, { apiUrl: "https://api.example.com" });
    container.registerClass(ApiClient, ApiClient);
    const client = container.resolve<ApiClient>(ApiClient);

    expect(client.config).toBeDefined();
    expect(client.config.apiUrl).toBe("https://api.example.com");
  });

  test("should have property available after resolve", () => {
    @Injectable()
    class Dependency {
      value = 42;
    }

    @Injectable()
    class MyService {
      @Autowired()
      dep!: Dependency;

      getValue(): number {
        return this.dep.value;
      }
    }

    const container = new Container(true);
    const service = container.resolve<MyService>(MyService);

    expect(service.dep).toBeDefined();
    expect(service.dep).toBeInstanceOf(Dependency);
    expect(service.getValue()).toBe(42);
  });

  test("should throw when type cannot be inferred and no token provided", () => {
    // Bun emits design:type for primitives (String, Number, etc.),
    // so we simulate missing metadata by calling Autowired() directly
    // on a target without design:type metadata
    expect(() => {
      class NoMetadata {}
      // Apply @Autowired() on a property that has no design:type metadata
      Autowired()(NoMetadata.prototype, "missing");
    }).toThrow(/Cannot infer type/);
  });

  test("should inject property after constructor runs", () => {
    const order: string[] = [];

    @Injectable()
    class Dependency {
      value = "injected";
    }

    @Injectable()
    class MyService {
      @Autowired()
      dep!: Dependency;

      constructorRan = false;

      constructor() {
        this.constructorRan = true;
        // At construction time, dep should not yet be set
        order.push(`constructor:dep=${String((this as any).dep)}`);
      }
    }

    const container = new Container(true);
    const service = container.resolve<MyService>(MyService);

    expect(service.constructorRan).toBe(true);
    expect(service.dep).toBeInstanceOf(Dependency);
    expect(order[0]).toBe("constructor:dep=undefined");
  });

  test("should work alongside constructor injection", () => {
    @Injectable()
    class Logger {
      name = "logger";
    }

    @Injectable()
    class Database {
      name = "db";
    }

    @Injectable()
    class UserService {
      @Autowired()
      logger!: Logger;

      constructor(public db: Database) {}
    }

    const container = new Container(true);
    const service = container.resolve<UserService>(UserService);

    expect(service.db).toBeInstanceOf(Database);
    expect(service.db.name).toBe("db");
    expect(service.logger).toBeInstanceOf(Logger);
    expect(service.logger.name).toBe("logger");
  });
});
