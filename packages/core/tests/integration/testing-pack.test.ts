/**
 * Integration tests for TestingPackFactory
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../src/container/container.ts";
import { Injectable } from "../../src/decorators/injectable.ts";
import { packRegistry } from "../../src/pack/pack-registry.ts";
import type { PackDefinition } from "../../src/pack/types.ts";
import { TestingPackFactory } from "../../src/testing/testing-pack.ts";
import { InjectionToken } from "../../src/types/token.ts";
import { cleanRegistry } from "../helpers/test-helpers.ts";

describe("TestingPackFactory", () => {
  beforeEach(() => {
    cleanRegistry();
    packRegistry.clear();
  });

  test("create + compile resolves providers from pack", async () => {
    @Injectable()
    class GreetingService {
      greet(name: string) {
        return `Hello, ${name}`;
      }
    }

    const pack: PackDefinition = {
      meta: { name: "greeting-pack" },
      providers: [GreetingService],
      exports: [GreetingService],
    };

    const testPack = await TestingPackFactory.create(pack).compile();

    const service = testPack.get(GreetingService);
    expect(service).toBeInstanceOf(GreetingService);
    expect(service.greet("World")).toBe("Hello, World");

    await testPack.close();
  });

  test("overrideValue replaces provider", async () => {
    const CONFIG_TOKEN = new InjectionToken<{ url: string }>("Config");

    const pack: PackDefinition = {
      meta: { name: "config-pack" },
      providers: [{ token: CONFIG_TOKEN, useValue: { url: "https://prod.example.com" } }],
      exports: [CONFIG_TOKEN],
    };

    const testPack = await TestingPackFactory.create(pack)
      .overrideValue(CONFIG_TOKEN, { url: "https://test.example.com" })
      .compile();

    const config = testPack.get(CONFIG_TOKEN);
    expect(config.url).toBe("https://test.example.com");

    await testPack.close();
  });

  test("override (class) replaces provider", async () => {
    @Injectable()
    class RealService {
      getValue() {
        return "real";
      }
    }

    @Injectable()
    class MockService {
      getValue() {
        return "mock";
      }
    }

    const pack: PackDefinition = {
      meta: { name: "service-pack" },
      providers: [RealService],
      exports: [RealService],
    };

    const testPack = await TestingPackFactory.create(pack)
      .override(RealService, MockService)
      .compile();

    const service = testPack.get(RealService);
    expect(service.getValue()).toBe("mock");

    await testPack.close();
  });

  test("overrideFactory replaces provider", async () => {
    const COUNTER_TOKEN = new InjectionToken<{ count: number }>("Counter");

    const pack: PackDefinition = {
      meta: { name: "counter-pack" },
      providers: [{ token: COUNTER_TOKEN, useValue: { count: 0 } }],
      exports: [COUNTER_TOKEN],
    };

    const testPack = await TestingPackFactory.create(pack)
      .overrideFactory(COUNTER_TOKEN, () => ({ count: 42 }))
      .compile();

    const counter = testPack.get(COUNTER_TOKEN);
    expect(counter.count).toBe(42);

    await testPack.close();
  });

  test("getOptional returns undefined for unregistered token", async () => {
    const UNKNOWN_TOKEN = new InjectionToken<string>("Unknown");

    const pack: PackDefinition = {
      meta: { name: "empty-pack" },
      providers: [],
      exports: [],
    };

    const testPack = await TestingPackFactory.create(pack).compile();

    const result = testPack.getOptional(UNKNOWN_TOKEN);
    expect(result).toBeUndefined();

    await testPack.close();
  });

  test("getContainer returns Container instance", async () => {
    const pack: PackDefinition = {
      meta: { name: "container-pack" },
      providers: [],
      exports: [],
    };

    const testPack = await TestingPackFactory.create(pack).compile();

    const container = testPack.getContainer();
    expect(container).toBeInstanceOf(Container);

    await testPack.close();
  });

  test("close executes onDestroy hooks", async () => {
    let destroyed = false;

    const pack: PackDefinition = {
      meta: { name: "destroy-pack" },
      providers: [],
      exports: [],
      onDestroy: async () => {
        destroyed = true;
      },
    };

    const testPack = await TestingPackFactory.create(pack).compile();
    expect(destroyed).toBe(false);

    await testPack.close();
    expect(destroyed).toBe(true);
  });

  test("onInit called during compile", async () => {
    let initialized = false;

    const pack: PackDefinition = {
      meta: { name: "init-pack" },
      providers: [],
      exports: [],
      onInit: async () => {
        initialized = true;
      },
    };

    expect(initialized).toBe(false);
    const testPack = await TestingPackFactory.create(pack).compile();
    expect(initialized).toBe(true);

    await testPack.close();
  });

  test("close() calls destroyAll — provider onDestroy hooks are invoked", async () => {
    let providerDestroyed = false;

    @Injectable()
    class DestroyableService {
      onDestroy() {
        providerDestroyed = true;
      }
    }

    const pack: PackDefinition = {
      meta: { name: "destroyable-pack" },
      providers: [DestroyableService],
      exports: [DestroyableService],
    };

    const testPack = await TestingPackFactory.create(pack).compile();

    // Resolve to trigger instantiation (and onDestroy tracking)
    testPack.get(DestroyableService);
    expect(providerDestroyed).toBe(false);

    await testPack.close();
    expect(providerDestroyed).toBe(true);
  });

  test("multiple packs with imports", async () => {
    @Injectable()
    class DatabaseService {
      query() {
        return "data";
      }
    }

    @Injectable()
    class LoggerService {
      log(msg: string) {
        return `[LOG] ${msg}`;
      }
    }

    const infraPack: PackDefinition = {
      meta: { name: "infra-pack" },
      providers: [DatabaseService, LoggerService],
      exports: [DatabaseService, LoggerService],
    };

    @Injectable()
    class UserService {
      constructor(
        public db: DatabaseService,
        public logger: LoggerService,
      ) {}

      getUser() {
        this.logger.log("fetching user");
        return this.db.query();
      }
    }

    const userPack: PackDefinition = {
      meta: { name: "user-pack" },
      imports: [infraPack],
      providers: [UserService],
      exports: [UserService],
    };

    const testPack = await TestingPackFactory.create(userPack).compile();

    const userService = testPack.get(UserService);
    expect(userService).toBeInstanceOf(UserService);
    expect(userService.db).toBeInstanceOf(DatabaseService);
    expect(userService.logger).toBeInstanceOf(LoggerService);
    expect(userService.getUser()).toBe("data");

    await testPack.close();
  });
});
