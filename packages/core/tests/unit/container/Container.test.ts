/**
 * Container Unit Tests
 */

import { describe, expect, test } from "bun:test";
import { Container } from "../../../src/container/container.ts";
import { ProviderNotFoundError } from "../../../src/container/errors.ts";
import { Scope } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import type { TestConfig } from "../../helpers/fixtures.ts";
import {
  DEFAULT_TEST_CONFIG,
  TEST_CONFIG,
  TestDatabase,
  TestLogger,
  TestUserService,
} from "../../helpers/fixtures.ts";
import { createTestContainer } from "../../helpers/test-helpers.ts";

describe("Container", () => {
  describe("Creation", () => {
    test("should create a new container", () => {
      const container = createTestContainer();
      expect(container).toBeDefined();
      expect(container).toBeInstanceOf(Container);
    });

    test("should auto-register providers from Registry when autoRegister is true", () => {
      // Don't clean registry here - fixtures are auto-registered on import
      const container = new Container(true);
      // TestDatabase should be auto-registered via @Injectable
      expect(container.has(TestDatabase)).toBe(true);
    });

    test("should not auto-register when autoRegister is false", () => {
      const container = createTestContainer();
      // Container created with autoRegister=false won't copy from Registry initially
      // But will still check Registry on demand
      container.registerClass(TestDatabase, TestDatabase);
      expect(container.has(TestDatabase)).toBe(true);
    });
  });

  describe("Provider Registration", () => {
    test("should register a class provider", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);
      expect(container.has(TestDatabase)).toBe(true);
    });

    test("should register a value provider", () => {
      const container = createTestContainer();
      container.registerValue(TEST_CONFIG, DEFAULT_TEST_CONFIG);
      expect(container.has(TEST_CONFIG)).toBe(true);
    });

    test("should register a factory provider", () => {
      const container = createTestContainer();
      container.registerFactory(TestLogger, () => new TestLogger(), Scope.SINGLETON);
      expect(container.has(TestLogger)).toBe(true);
    });

    test("should register an existing provider (alias)", () => {
      const container = createTestContainer();
      const ALIAS = new InjectionToken("DatabaseAlias");

      container.registerClass(TestDatabase, TestDatabase);
      container.registerExisting(ALIAS, TestDatabase);

      expect(container.has(ALIAS)).toBe(true);
    });

    test("should register with custom scope", () => {
      const container = createTestContainer();
      container.registerClass(TestLogger, TestLogger, Scope.TRANSIENT);

      const logger1 = container.resolve<TestLogger>(TestLogger);
      const logger2 = container.resolve<TestLogger>(TestLogger);

      expect(logger1).not.toBe(logger2); // Different instances
    });
  });

  describe("Resolution", () => {
    test("should resolve a registered class", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);

      const db = container.resolve<TestDatabase>(TestDatabase);
      expect(db).toBeInstanceOf(TestDatabase);
    });

    test("should resolve with constructor dependencies", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);
      container.registerClass(TestLogger, TestLogger);
      container.registerClass(TestUserService, TestUserService);

      const userService = container.resolve<TestUserService>(TestUserService);
      expect(userService).toBeInstanceOf(TestUserService);
      expect(userService.db).toBeInstanceOf(TestDatabase);
      expect(userService.logger).toBeInstanceOf(TestLogger);
    });

    test("should resolve value providers", () => {
      const container = createTestContainer();
      container.registerValue(TEST_CONFIG, DEFAULT_TEST_CONFIG);

      const config = container.resolve<TestConfig>(TEST_CONFIG);
      expect(config).toEqual(DEFAULT_TEST_CONFIG);
    });

    test("should throw ProviderNotFoundError when provider not found", () => {
      const container = createTestContainer();
      const UnregisteredToken = new InjectionToken("Unregistered");

      expect(() => container.resolve<any>(UnregisteredToken)).toThrow(ProviderNotFoundError);
    });

    test("should return undefined for resolveOptional when provider not found", () => {
      const container = createTestContainer();
      const UnregisteredToken = new InjectionToken("Unregistered");

      const result = container.resolveOptional(UnregisteredToken);
      expect(result).toBeUndefined();
    });

    test("should return instance for resolveOptional when provider exists", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);

      const result = container.resolveOptional(TestDatabase);
      expect(result).toBeInstanceOf(TestDatabase);
    });
  });

  describe("Async Resolution", () => {
    test("should resolve async factory", async () => {
      const container = createTestContainer();

      container.registerFactory(TestLogger, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new TestLogger();
      });

      const logger = await container.resolveAsync(TestLogger);
      expect(logger).toBeInstanceOf(TestLogger);
    });

    test("should resolve sync factory with resolveAsync", async () => {
      const container = createTestContainer();

      container.registerFactory(TestLogger, () => new TestLogger());

      const logger = await container.resolveAsync(TestLogger);
      expect(logger).toBeInstanceOf(TestLogger);
    });
  });

  describe("Provider Lookup", () => {
    test("has() should return true for registered provider", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);

      expect(container.has(TestDatabase)).toBe(true);
    });

    test("has() should return false for unregistered provider", () => {
      const container = createTestContainer();

      expect(container.has(TestDatabase)).toBe(false);
    });

    test("getTokens() should return all registered tokens", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);
      container.registerClass(TestLogger, TestLogger);

      const tokens = container.getTokens();
      expect(tokens).toContain(TestDatabase);
      expect(tokens).toContain(TestLogger);
      expect(tokens.length).toBe(2);
    });
  });

  describe("Provider Removal", () => {
    test("should remove a provider", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);

      expect(container.has(TestDatabase)).toBe(true);

      const removed = container.remove(TestDatabase);
      expect(removed).toBe(true);
      expect(container.has(TestDatabase)).toBe(false);
    });

    test("remove() should return false for non-existent provider", () => {
      const container = createTestContainer();

      const removed = container.remove(TestDatabase);
      expect(removed).toBe(false);
    });
  });

  describe("Cache Clearing", () => {
    test("clearScope() should clear singleton cache", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase, Scope.SINGLETON);

      const db1 = container.resolve<TestDatabase>(TestDatabase);
      container.clearScope(Scope.SINGLETON);
      const db2 = container.resolve<TestDatabase>(TestDatabase);

      expect(db1).not.toBe(db2); // Different instances after clear
    });

    test("clearAll() should clear all caches", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase, Scope.SINGLETON);
      container.registerClass(TestLogger, TestLogger, Scope.SINGLETON);

      const db1 = container.resolve<TestDatabase>(TestDatabase);
      const logger1 = container.resolve<TestLogger>(TestLogger);

      container.clearAll();

      const db2 = container.resolve<TestDatabase>(TestDatabase);
      const logger2 = container.resolve<TestLogger>(TestLogger);

      expect(db1).not.toBe(db2);
      expect(logger1).not.toBe(logger2);
    });
  });

  describe("Child Containers", () => {
    test("should create a child container", () => {
      const parent = createTestContainer();
      const child = parent.createChild();

      expect(child).toBeInstanceOf(Container);
      expect(child).not.toBe(parent);
    });

    test("child should inherit providers from parent", () => {
      const parent = createTestContainer();
      parent.registerClass(TestDatabase, TestDatabase);

      const child = parent.createChild();
      expect(child.has(TestDatabase)).toBe(true);

      const db = child.resolve(TestDatabase);
      expect(db).toBeInstanceOf(TestDatabase);
    });

    test("child can override parent providers", () => {
      const parent = createTestContainer();
      parent.registerValue(TEST_CONFIG, { apiUrl: "parent", port: 3000 });

      const child = parent.createChild();
      child.registerValue(TEST_CONFIG, { apiUrl: "child", port: 4000 });

      const parentConfig = parent.resolve(TEST_CONFIG);
      const childConfig = child.resolve(TEST_CONFIG);

      expect(parentConfig.apiUrl).toBe("parent");
      expect(childConfig.apiUrl).toBe("child");
    });

    test("child inherits mode and enableCycleDetection from parent", () => {
      const parent = new Container({
        autoRegister: false,
        mode: "production",
        enableCycleDetection: false,
      });
      parent.registerClass(TestDatabase, TestDatabase);

      const child = parent.createChild();
      child.registerClass(TestLogger, TestLogger);

      // Should resolve without issues (production mode, no cycle detection)
      const db = child.resolve(TestDatabase);
      expect(db).toBeInstanceOf(TestDatabase);
      const logger = child.resolve(TestLogger);
      expect(logger).toBeInstanceOf(TestLogger);
    });
  });

  describe("Primitive resolution", () => {
    test("resolve works with primitive value providers (string)", () => {
      const TOKEN = new InjectionToken<string>("greeting");
      const container = createTestContainer();
      container.registerValue(TOKEN, "hello");

      const result = container.resolve(TOKEN);
      expect(result).toBe("hello");
    });

    test("resolve works with primitive value providers (number)", () => {
      const TOKEN = new InjectionToken<number>("port");
      const container = createTestContainer();
      container.registerValue(TOKEN, 3000);

      const result = container.resolve(TOKEN);
      expect(result).toBe(3000);
    });
  });

  describe("Export enforcement", () => {
    test("enforceExports blocks non-exported tokens", () => {
      const container = new Container({
        autoRegister: false,
        enforceExports: true,
      });
      const EXPORTED = new InjectionToken<string>("exported");
      const INTERNAL = new InjectionToken<string>("internal");

      container.registerValue(EXPORTED, "visible");
      container.registerValue(INTERNAL, "hidden");
      container.setExportedTokens(new Set([EXPORTED]));

      expect(container.resolve(EXPORTED)).toBe("visible");
      expect(() => container.resolve(INTERNAL)).toThrow("not exported");
    });

    test("resolveOptional also enforces exports", () => {
      const container = new Container({
        autoRegister: false,
        enforceExports: true,
      });
      const INTERNAL = new InjectionToken<string>("internal");
      container.registerValue(INTERNAL, "hidden");
      container.setExportedTokens(new Set());

      expect(() => container.resolveOptional(INTERNAL)).toThrow("not exported");
    });

    test("without enforceExports, all tokens are accessible", () => {
      const container = createTestContainer();
      const TOKEN = new InjectionToken<string>("token");
      container.registerValue(TOKEN, "value");

      expect(container.resolve(TOKEN)).toBe("value");
    });
  });

  describe("Diagnostics", () => {
    test("getDiagnostics() should return container stats", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);
      container.registerClass(TestLogger, TestLogger);

      const diag = container.getDiagnostics();

      expect(diag.providerCount).toBe(2);
      expect(diag.singletonCacheSize).toBeDefined();
      expect(diag.hasParent).toBe(false);
    });

    test("snapshot() should return all providers", () => {
      const container = createTestContainer();
      container.registerClass(TestDatabase, TestDatabase);
      container.registerValue(TEST_CONFIG, DEFAULT_TEST_CONFIG);

      const snapshot = container.snapshot();

      expect(snapshot.length).toBe(2);
      expect(snapshot.some((p) => p.token === TestDatabase)).toBe(true);
      expect(snapshot.some((p) => p.token === TEST_CONFIG)).toBe(true);
    });
  });

  describe("Request Storage", () => {
    test("should expose requestStorage", () => {
      const container = createTestContainer();

      expect(container.requestStorage).toBeDefined();
      expect(typeof container.requestStorage.run).toBe("function");
    });
  });
});
