import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Container } from "../container.ts";
import {
  CircularDependencyError,
  ProviderNotFoundError,
} from "../errors.ts";
import { Registry } from "../registry.ts";
import { Inject } from "../../decorators/inject.ts";
import { Injectable } from "../../decorators/injectable.ts";
import { Optional } from "../../decorators/optional.ts";
import { Autowired } from "../../decorators/autowired.ts";
import { Scope } from "../../scope/types.ts";
import { InjectionToken } from "../../types/token.ts";
import { AmbrosiaError } from "../../errors/ambrosia-error.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a fresh container with autoRegister off so global registry does not leak */
function freshContainer(opts: ConstructorParameters<typeof Container>[0] = false) {
  return new Container(typeof opts === "boolean" ? opts : { autoRegister: false, ...opts });
}

// ─── Test Suites ────────────────────────────────────────────────────────────

describe("Container", () => {
  let container: Container;

  beforeEach(() => {
    Registry.reset();
    container = freshContainer();
  });

  afterEach(() => {
    Registry.reset();
  });

  // ==================== ClassProvider ====================

  describe("ClassProvider", () => {
    it("should register and resolve a class provider", () => {
      class Foo {
        value = 42;
      }
      container.registerClass(Foo, Foo);
      const instance = container.resolve(Foo);
      expect(instance).toBeInstanceOf(Foo);
      expect(instance.value).toBe(42);
    });

    it("should resolve class provider registered via register()", () => {
      class Bar {}
      container.register({ token: Bar, useClass: Bar, scope: Scope.SINGLETON });
      expect(container.resolve(Bar)).toBeInstanceOf(Bar);
    });
  });

  // ==================== ValueProvider ====================

  describe("ValueProvider", () => {
    it("should register and resolve a value provider", () => {
      const TOKEN = new InjectionToken<string>("greeting");
      container.registerValue(TOKEN, "hello");
      expect(container.resolve(TOKEN)).toBe("hello");
    });

    it("should support object values", () => {
      const CONFIG = new InjectionToken<{ port: number }>("config");
      const cfg = { port: 3000 };
      container.registerValue(CONFIG, cfg);
      expect(container.resolve(CONFIG)).toBe(cfg);
    });

    it("should allow falsy values", () => {
      const TOKEN = new InjectionToken<number>("zero");
      container.registerValue(TOKEN, 0);
      expect(container.resolve(TOKEN)).toBe(0);
    });
  });

  // ==================== FactoryProvider ====================

  describe("FactoryProvider", () => {
    it("should register and resolve a factory provider", () => {
      const TOKEN = new InjectionToken<string>("factory-val");
      container.registerFactory(TOKEN, () => "created-by-factory");
      expect(container.resolve(TOKEN)).toBe("created-by-factory");
    });

    it("should pass container facade to factory", () => {
      const DEP = new InjectionToken<number>("dep");
      const RESULT = new InjectionToken<string>("result");
      container.registerValue(DEP, 100);
      container.registerFactory(RESULT, (c) => `value=${c.resolve(DEP)}`);
      expect(container.resolve(RESULT)).toBe("value=100");
    });
  });

  // ==================== ExistingProvider ====================

  describe("ExistingProvider", () => {
    it("should register and resolve an existing (alias) provider", () => {
      class RealService {
        name = "real";
      }
      const ALIAS = new InjectionToken<RealService>("alias");
      container.registerClass(RealService, RealService);
      container.registerExisting(ALIAS, RealService);
      const aliased = container.resolve(ALIAS);
      expect(aliased).toBeInstanceOf(RealService);
      expect(aliased.name).toBe("real");
    });

    it("should resolve alias to the same singleton instance", () => {
      class Svc {}
      const ALIAS = new InjectionToken<Svc>("alias");
      container.registerClass(Svc, Svc, Scope.SINGLETON);
      container.registerExisting(ALIAS, Svc);
      expect(container.resolve(ALIAS)).toBe(container.resolve(Svc));
    });
  });

  // ==================== Singleton Scope ====================

  describe("Singleton scope", () => {
    it("should return the same instance on multiple resolves", () => {
      class Singleton {}
      container.registerClass(Singleton, Singleton, Scope.SINGLETON);
      const a = container.resolve(Singleton);
      const b = container.resolve(Singleton);
      expect(a).toBe(b);
    });
  });

  // ==================== Transient Scope ====================

  describe("Transient scope", () => {
    it("should return a new instance every time", () => {
      class Transient {}
      container.registerClass(Transient, Transient, Scope.TRANSIENT);
      const a = container.resolve(Transient);
      const b = container.resolve(Transient);
      expect(a).not.toBe(b);
      expect(a).toBeInstanceOf(Transient);
      expect(b).toBeInstanceOf(Transient);
    });
  });

  // ==================== Request Scope ====================

  describe("Request scope", () => {
    it("should provide isolated instances per request context", () => {
      class ReqScoped {
        id = Math.random();
      }
      container.registerClass(ReqScoped, ReqScoped, Scope.REQUEST);

      let instanceA: ReqScoped | undefined;
      let instanceB: ReqScoped | undefined;

      container.requestStorage.run(() => {
        instanceA = container.resolve(ReqScoped);
        // Same within the same request context
        expect(container.resolve(ReqScoped)).toBe(instanceA);
      });

      container.requestStorage.run(() => {
        instanceB = container.resolve(ReqScoped);
      });

      expect(instanceA).toBeDefined();
      expect(instanceB).toBeDefined();
      // Different across request contexts
      expect(instanceA).not.toBe(instanceB);
    });
  });

  // ==================== @Inject Decorator ====================

  describe("@Inject decorator resolution", () => {
    it("should resolve dependencies using @Inject token", () => {
      const API_URL = new InjectionToken<string>("API_URL");

      @Injectable()
      class ApiClient {
        constructor(@Inject(API_URL) public url: string) {}
      }

      // Fresh container with autoRegister to pick up @Injectable
      const c = new Container(true);
      c.registerValue(API_URL, "https://api.test");

      const client = c.resolve(ApiClient);
      expect(client.url).toBe("https://api.test");
    });
  });

  // ==================== @Optional Decorator ====================

  describe("@Optional decorator", () => {
    it("should return undefined for missing optional dependency", () => {
      class MissingService {}

      @Injectable()
      class Consumer {
        constructor(@Optional() @Inject(MissingService) public svc?: MissingService) {}
      }

      const c = new Container(true);
      const consumer = c.resolve(Consumer);
      expect(consumer.svc).toBeUndefined();
    });

    it("should inject value when optional dependency is available", () => {
      @Injectable()
      class Available {
        ok = true;
      }

      @Injectable()
      class Consumer2 {
        constructor(@Optional() public svc: Available) {}
      }

      const c = new Container(true);
      const consumer = c.resolve(Consumer2);
      expect(consumer.svc).toBeInstanceOf(Available);
      expect(consumer.svc.ok).toBe(true);
    });
  });

  // ==================== @Autowired Property Injection ====================

  describe("@Autowired property injection", () => {
    it("should inject properties after construction", () => {
      @Injectable()
      class Dep {
        val = "injected";
      }

      @Injectable()
      class Host {
        @Autowired()
        dep!: Dep;
      }

      const c = new Container(true);
      const host = c.resolve(Host);
      expect(host.dep).toBeInstanceOf(Dep);
      expect(host.dep.val).toBe("injected");
    });

    it("should inject property with explicit token", () => {
      const TOKEN = new InjectionToken<string>("prop-token");

      @Injectable()
      class Host2 {
        @Autowired(TOKEN)
        greeting!: string;
      }

      const c = new Container(true);
      c.registerValue(TOKEN, "hi");
      const host = c.resolve(Host2);
      expect(host.greeting).toBe("hi");
    });
  });

  // ==================== Circular Dependency Detection ====================

  describe("Circular dependency detection", () => {
    it("should throw CircularDependencyError for circular constructor deps", () => {
      // We cannot use @Injectable here because that auto-registers,
      // and circular deps need careful setup. Register manually.
      class A {
        constructor(public b: any) {}
      }
      class B {
        constructor(public a: any) {}
      }

      // Simulate metadata: A depends on B, B depends on A
      Reflect.defineMetadata("design:paramtypes", [B], A);
      Reflect.defineMetadata("design:paramtypes", [A], B);

      container.registerClass(A, A, Scope.SINGLETON);
      container.registerClass(B, B, Scope.SINGLETON);

      expect(() => container.resolve(A)).toThrow();
    });
  });

  // ==================== autoResolveCircular ====================

  describe("autoResolveCircular", () => {
    it("should resolve circular deps with lazy proxy when enabled", () => {
      class CycleA {
        constructor(public b: any) {}
        name() {
          return "A";
        }
      }
      class CycleB {
        constructor(public a: any) {}
        name() {
          return "B";
        }
      }

      Reflect.defineMetadata("design:paramtypes", [CycleB], CycleA);
      Reflect.defineMetadata("design:paramtypes", [CycleA], CycleB);

      const c = freshContainer({ autoResolveCircular: true });
      c.registerClass(CycleA, CycleA, Scope.SINGLETON);
      c.registerClass(CycleB, CycleB, Scope.SINGLETON);

      // Should not throw
      const a = c.resolve(CycleA);
      expect(a).toBeDefined();
      expect(a.name()).toBe("A");
    });
  });

  // ==================== Provider Not Found (AMB001) ====================

  describe("Provider not found error", () => {
    it("should throw ProviderNotFoundError for unregistered token", () => {
      class Unknown {}
      expect(() => container.resolve(Unknown)).toThrow(ProviderNotFoundError);
    });

    it("should include token info in error message", () => {
      class MissingSvc {}
      try {
        container.resolve(MissingSvc);
        // Should not reach here
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(ProviderNotFoundError);
        expect((e as ProviderNotFoundError).message).toContain("MissingSvc");
      }
    });
  });

  // ==================== resolveOptional ====================

  describe("resolveOptional", () => {
    it("should return undefined for missing provider instead of throwing", () => {
      class NotHere {}
      const result = container.resolveOptional(NotHere);
      expect(result).toBeUndefined();
    });

    it("should return instance when provider exists", () => {
      class Here {
        v = 1;
      }
      container.registerClass(Here, Here);
      const result = container.resolveOptional(Here);
      expect(result).toBeInstanceOf(Here);
    });
  });

  // ==================== Child Container ====================

  describe("Child container", () => {
    it("should inherit parent providers", () => {
      class ParentSvc {}
      container.registerClass(ParentSvc, ParentSvc);
      const child = container.createChild();
      expect(child.resolve(ParentSvc)).toBeInstanceOf(ParentSvc);
    });

    it("should allow overriding parent providers", () => {
      const TOKEN = new InjectionToken<string>("val");
      container.registerValue(TOKEN, "parent");
      const child = container.createChild();
      child.registerValue(TOKEN, "child");
      expect(child.resolve(TOKEN)).toBe("child");
      expect(container.resolve(TOKEN)).toBe("parent");
    });
  });

  // ==================== Export Enforcement ====================

  describe("Export enforcement", () => {
    it("should throw AMB007 when enforceExports is enabled and token not exported", () => {
      const c = freshContainer({ enforceExports: true });
      class Internal {}
      c.registerClass(Internal, Internal);
      c.setExportedTokens(new Set());
      expect(() => c.resolve(Internal)).toThrow(AmbrosiaError);
    });

    it("should allow resolving exported tokens", () => {
      const c = freshContainer({ enforceExports: true });
      class Exported {}
      c.registerClass(Exported, Exported);
      c.setExportedTokens(new Set([Exported]));
      expect(c.resolve(Exported)).toBeInstanceOf(Exported);
    });
  });

  // ==================== Container Utility Methods ====================

  describe("Utility methods", () => {
    it("has() should return true for registered and false for missing", () => {
      class A {}
      container.registerClass(A, A);
      expect(container.has(A)).toBe(true);
      class B {}
      expect(container.has(B)).toBe(false);
    });

    it("remove() should unregister a provider", () => {
      class R {}
      container.registerClass(R, R);
      expect(container.has(R)).toBe(true);
      container.remove(R);
      expect(container.has(R)).toBe(false);
    });

    it("getTokens() should return all registered tokens", () => {
      class X {}
      class Y {}
      container.registerClass(X, X);
      container.registerClass(Y, Y);
      const tokens = container.getTokens();
      expect(tokens).toContain(X);
      expect(tokens).toContain(Y);
    });

    it("size should reflect provider count", () => {
      const initial = container.size;
      class S {}
      container.registerClass(S, S);
      expect(container.size).toBe(initial + 1);
    });

    it("snapshot() should return all providers", () => {
      class Sn {}
      container.registerClass(Sn, Sn);
      const snap = container.snapshot();
      expect(snap.length).toBeGreaterThanOrEqual(1);
      expect(snap.some((p) => p.token === Sn)).toBe(true);
    });

    it("getDiagnostics() should return container info", () => {
      const diag = container.getDiagnostics();
      expect(diag).toHaveProperty("providerCount");
      expect(diag).toHaveProperty("singletonCacheSize");
      expect(diag).toHaveProperty("requestCacheSize");
      expect(diag).toHaveProperty("hasParent");
      expect(diag.hasParent).toBe(false);
    });
  });

  // ==================== clearAll / clearScope ====================

  describe("clearAll / clearScope", () => {
    it("clearAll should clear singleton cache so next resolve creates new instance", () => {
      class Cl {}
      container.registerClass(Cl, Cl, Scope.SINGLETON);
      const first = container.resolve(Cl);
      container.clearAll();
      const second = container.resolve(Cl);
      expect(first).not.toBe(second);
    });

    it("clearScope(SINGLETON) should clear only singleton cache", () => {
      class Cs {}
      container.registerClass(Cs, Cs, Scope.SINGLETON);
      const first = container.resolve(Cs);
      container.clearScope(Scope.SINGLETON);
      const second = container.resolve(Cs);
      expect(first).not.toBe(second);
    });
  });

  // ==================== Async Resolution ====================

  describe("Async resolution", () => {
    it("resolveAsync should resolve factory providers", async () => {
      const TOKEN = new InjectionToken<number>("async-val");
      container.registerFactory(TOKEN, () => Promise.resolve(99));
      const val = await container.resolveAsync(TOKEN);
      expect(val).toBe(99);
    });

    it("resolveOptionalAsync should return undefined for missing", async () => {
      class Nope {}
      const val = await container.resolveOptionalAsync(Nope);
      expect(val).toBeUndefined();
    });
  });

  // ==================== registerInstance ====================

  describe("registerInstance", () => {
    it("should register a pre-created instance", () => {
      const TOKEN = new InjectionToken<{ id: number }>("inst");
      const obj = { id: 1 };
      container.registerInstance(TOKEN, obj);
      expect(container.resolve(TOKEN)).toBe(obj);
    });
  });
});
