/**
 * Resolver Unit Tests
 *
 * Tests the core dependency resolution logic via Container,
 * which wraps Resolver internally.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../../src/container/container.ts";
import {
  CircularDependencyError,
  InstantiationError,
  ProviderNotFoundError,
  ResolutionError,
} from "../../../src/container/errors.ts";
import { Inject } from "../../../src/decorators/inject.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { Scope } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import { cleanRegistry, createTestContainer } from "../../helpers/test-helpers.ts";

describe("Resolver", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  // ==================== Value Providers ====================

  describe("Value providers", () => {
    test("resolves value provider", () => {
      const TOKEN = new InjectionToken<string>("greeting");
      const container = createTestContainer();
      container.registerValue(TOKEN, "hello");

      const result = container.resolve(TOKEN);
      expect(result).toBe("hello");
    });

    test("value provider returns exact reference", () => {
      const TOKEN = new InjectionToken<{ count: number }>("config");
      const obj = { count: 42 };
      const container = createTestContainer();
      container.registerValue(TOKEN, obj);

      const result = container.resolve(TOKEN);
      expect(result).toBe(obj); // Same reference, not just equal
    });
  });

  // ==================== Class Providers ====================

  describe("Class providers", () => {
    test("resolves class with no dependencies", () => {
      @Injectable()
      class SimpleService {
        value = "simple";
      }

      const container = createTestContainer();
      container.registerClass(SimpleService, SimpleService);

      const instance = container.resolve(SimpleService);
      expect(instance).toBeInstanceOf(SimpleService);
      expect(instance.value).toBe("simple");
    });

    test("resolves class with constructor dependencies", () => {
      @Injectable()
      class Logger {
        log(msg: string) {
          return msg;
        }
      }

      @Injectable()
      class AppService {
        constructor(@Inject(Logger) public logger: Logger) {}
      }

      const container = createTestContainer();
      container.registerClass(Logger, Logger);
      container.registerClass(AppService, AppService);

      const instance = container.resolve(AppService);
      expect(instance).toBeInstanceOf(AppService);
      expect(instance.logger).toBeInstanceOf(Logger);
    });

    test("singleton scope returns same instance", () => {
      @Injectable()
      class SingletonService {}

      const container = createTestContainer();
      container.registerClass(SingletonService, SingletonService, Scope.SINGLETON);

      const a = container.resolve(SingletonService);
      const b = container.resolve(SingletonService);
      expect(a).toBe(b);
    });

    test("transient scope returns different instances", () => {
      @Injectable()
      class TransientService {}

      const container = createTestContainer();
      container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

      const a = container.resolve(TransientService);
      const b = container.resolve(TransientService);
      expect(a).not.toBe(b);
    });
  });

  // ==================== Factory Providers ====================

  describe("Factory providers", () => {
    test("resolves sync factory", () => {
      const TOKEN = new InjectionToken<number>("answer");
      const container = createTestContainer();
      container.registerFactory(TOKEN, () => 42);

      const result = container.resolve(TOKEN);
      expect(result).toBe(42);
    });

    test("factory receives container facade with resolve/resolveOptional", () => {
      const DEP_TOKEN = new InjectionToken<string>("dep");
      const RESULT_TOKEN = new InjectionToken<string>("result");
      const MISSING_TOKEN = new InjectionToken<string>("missing");

      const container = createTestContainer();
      container.registerValue(DEP_TOKEN, "dependency-value");
      container.registerFactory(RESULT_TOKEN, (facade) => {
        const dep = facade.resolve(DEP_TOKEN);
        const missing = facade.resolveOptional(MISSING_TOKEN);
        return `${dep}:${missing}`;
      });

      const result = container.resolve(RESULT_TOKEN);
      expect(result).toBe("dependency-value:undefined");
    });

    test("factory error preserves cause", () => {
      const TOKEN = new InjectionToken("broken-factory");
      const originalError = new Error("original failure");

      const container = createTestContainer();
      container.registerFactory(TOKEN, () => {
        throw originalError;
      });

      try {
        container.resolve(TOKEN);
        expect.unreachable("should have thrown");
      } catch (err: any) {
        // The factory error is now an InstantiationError with the original error as cause
        expect(err).toBeInstanceOf(InstantiationError);
        expect(err.cause).toBe(originalError);
      }
    });

    test("async factory with resolveAsync", async () => {
      const TOKEN = new InjectionToken<string>("async-value");
      const container = createTestContainer();
      container.registerFactory(TOKEN, async () => {
        return "async-result";
      });

      const result = await container.resolveAsync(TOKEN);
      expect(result).toBe("async-result");
    });
  });

  // ==================== Existing Providers ====================

  describe("Existing providers", () => {
    test("resolves existing provider (alias)", () => {
      const ORIGINAL = new InjectionToken<string>("original");
      const ALIAS = new InjectionToken<string>("alias");

      const container = createTestContainer();
      container.registerValue(ORIGINAL, "the-value");
      container.registerExisting(ALIAS, ORIGINAL);

      const result = container.resolve(ALIAS);
      expect(result).toBe("the-value");
    });
  });

  // ==================== Error Handling ====================

  describe("Error handling", () => {
    test("throws ProviderNotFoundError for unknown token", () => {
      const TOKEN = new InjectionToken("nonexistent");
      const container = createTestContainer();

      expect(() => container.resolve(TOKEN)).toThrow(ProviderNotFoundError);
    });

    test("returns undefined for optional unknown token", () => {
      const TOKEN = new InjectionToken("nonexistent");
      const container = createTestContainer();

      const result = container.resolveOptional(TOKEN);
      expect(result).toBeUndefined();
    });

    test("throws CircularDependencyError for circular deps", () => {
      const TOKEN_A = new InjectionToken("CircA");
      const TOKEN_B = new InjectionToken("CircB");

      @Injectable()
      class ServiceA {
        constructor(@Inject(TOKEN_B) public b: any) {}
      }

      @Injectable()
      class ServiceB {
        constructor(@Inject(TOKEN_A) public a: any) {}
      }

      const container = createTestContainer();
      container.registerClass(TOKEN_A, ServiceA);
      container.registerClass(TOKEN_B, ServiceB);

      expect(() => container.resolve(TOKEN_A)).toThrow(CircularDependencyError);
    });
  });

  // ==================== Lifecycle ====================

  describe("Lifecycle", () => {
    test("calls sync onInit after creation", () => {
      let initCalled = false;

      @Injectable()
      class WithInit {
        onInit() {
          initCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(WithInit, WithInit);
      container.resolve(WithInit);

      expect(initCalled).toBe(true);
    });

    test("throws if sync resolve encounters async onInit", () => {
      @Injectable()
      class AsyncInit {
        async onInit() {
          return;
        }
      }

      const container = createTestContainer();
      container.registerClass(AsyncInit, AsyncInit);

      expect(() => container.resolve(AsyncInit)).toThrow("returned a Promise");
    });

    test("resolveAsync calls async onInit", async () => {
      let initCalled = false;

      @Injectable()
      class AsyncInitService {
        async onInit() {
          initCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(AsyncInitService, AsyncInitService);
      await container.resolveAsync(AsyncInitService);

      expect(initCalled).toBe(true);
    });

    test("tracks onDestroy instances and destroyAll calls them", async () => {
      let destroyCalled = false;

      @Injectable()
      class WithDestroy {
        onDestroy() {
          destroyCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(WithDestroy, WithDestroy);
      container.resolve(WithDestroy);

      expect(destroyCalled).toBe(false);

      await container.destroyAll();
      expect(destroyCalled).toBe(true);
    });
  });

  // ==================== Caching ====================

  describe("Caching", () => {
    test("singleton cached across multiple resolves", () => {
      @Injectable()
      class CachedService {
        id = Math.random();
      }

      const container = createTestContainer();
      container.registerClass(CachedService, CachedService, Scope.SINGLETON);

      const first = container.resolve(CachedService);
      const second = container.resolve(CachedService);
      const third = container.resolve(CachedService);

      expect(first).toBe(second);
      expect(second).toBe(third);
      expect(first.id).toBe(third.id);
    });

    test("production mode skips cycle detection for cached instances", () => {
      @Injectable()
      class ProdService {
        value = "prod";
      }

      const container = new Container({
        autoRegister: false,
        mode: "production",
      });
      container.registerClass(ProdService, ProdService, Scope.SINGLETON);

      // First resolve populates cache
      const first = container.resolve(ProdService);
      // Second resolve should hit the fast path (no cycle detection)
      const second = container.resolve(ProdService);

      expect(first).toBe(second);
      expect(first.value).toBe("prod");
    });
  });

  // ==================== Plugin Hooks ====================

  describe("Plugin hooks", () => {
    test("onBeforeResolve and onAfterResolve are called during resolution", () => {
      const events: string[] = [];

      const container = createTestContainer();
      container.use({
        name: "test-plugin",
        onBeforeResolve(token, _context) {
          events.push(`before:${String(token)}`);
        },
        onAfterResolve(token, _instance, _context) {
          events.push(`after:${String(token)}`);
        },
      });

      const TOKEN = new InjectionToken<string>("test-value");
      container.registerValue(TOKEN, "hello");
      container.resolve(TOKEN);

      expect(events).toContain(`before:${String(TOKEN)}`);
      expect(events).toContain(`after:${String(TOKEN)}`);
    });

    test("onError is called when resolution fails", () => {
      const errors: Error[] = [];

      const container = createTestContainer();
      container.use({
        name: "error-plugin",
        onError(error, _context) {
          errors.push(error);
        },
      });

      const TOKEN = new InjectionToken("broken");
      container.registerFactory(TOKEN, () => {
        throw new Error("factory failure");
      });

      expect(() => container.resolve(TOKEN)).toThrow();
      expect(errors.length).toBeGreaterThan(0);
    });

    test("onAfterResolve receives the resolved instance", () => {
      let resolvedInstance: unknown = null;

      @Injectable()
      class TrackedService {
        id = "tracked";
      }

      const container = createTestContainer();
      container.use({
        name: "instance-tracker",
        onAfterResolve(_token, instance, _context) {
          resolvedInstance = instance;
        },
      });

      container.registerClass(TrackedService, TrackedService);
      const result = container.resolve(TrackedService);

      expect(resolvedInstance).toBe(result);
    });
  });

  // ==================== REQUEST scope early cache ====================

  describe("REQUEST scope early cache", () => {
    test("request-scoped instances are cached during resolution with autoResolveCircular", () => {
      @Injectable()
      class RequestService {
        id = Math.random();
      }

      const container = new Container({
        autoRegister: false,
        autoResolveCircular: true,
      });
      container.registerClass(RequestService, RequestService, Scope.REQUEST);

      // Resolve inside a request scope
      container.requestStorage.run(() => {
        const first = container.resolve(RequestService);
        const second = container.resolve(RequestService);
        expect(first).toBe(second);
      });
    });
  });
});
