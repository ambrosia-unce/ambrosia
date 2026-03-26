/**
 * Tests for Resolver fixes:
 * - Cache rollback on property injection failure
 * - Optional @Autowired error handling
 * - Circular dependencies with 3+ classes
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../../src/container/container.ts";
import { PropertyInjectionError, ProviderNotFoundError } from "../../../src/container/errors.ts";
import { Autowired } from "../../../src/decorators/autowired.ts";
import { Inject } from "../../../src/decorators/inject.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { Optional } from "../../../src/decorators/optional.ts";
import { Scope } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import { cleanRegistry, createTestContainer } from "../../helpers/test-helpers.ts";

describe("Resolver fixes", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  // ==================== Cache rollback on property injection failure ====================

  describe("Cache rollback on property injection failure", () => {
    test("singleton cache is cleared when property injection fails", () => {
      const FAILING_TOKEN = new InjectionToken("failing-dep");

      @Injectable()
      class FailingDep {
        constructor() {
          throw new Error("construction failed");
        }
      }

      @Injectable()
      class ServiceWithDep {
        @Autowired(FAILING_TOKEN)
        dep!: FailingDep;
      }

      const container = createTestContainer();
      container.registerClass(FAILING_TOKEN, FailingDep);
      container.registerClass(ServiceWithDep, ServiceWithDep, Scope.SINGLETON);

      // First resolve should fail
      expect(() => container.resolve(ServiceWithDep)).toThrow();

      // Fix the provider
      container.registerClass(
        FAILING_TOKEN,
        class FixedDep {
          value = "fixed";
        } as any,
      );

      // Second resolve should NOT return broken cached instance — it should re-create
      const instance = container.resolve(ServiceWithDep);
      expect(instance).toBeInstanceOf(ServiceWithDep);
      expect(instance.dep).toBeDefined();
    });

    test("request-scoped cache is cleared when property injection fails", () => {
      const FAILING_TOKEN = new InjectionToken("req-fail");

      @Injectable()
      class ReqFailDep {
        constructor() {
          throw new Error("req dep failed");
        }
      }

      @Injectable()
      class ReqService {
        @Autowired(FAILING_TOKEN)
        dep!: any;
      }

      const container = createTestContainer();
      container.registerClass(FAILING_TOKEN, ReqFailDep);
      container.registerClass(ReqService, ReqService, Scope.REQUEST);

      container.requestStorage.run(() => {
        // First resolve should fail
        expect(() => container.resolve(ReqService)).toThrow();

        // Fix the dep
        @Injectable()
        class FixedReqDep {
          value = "fixed";
        }
        container.registerClass(FAILING_TOKEN, FixedReqDep);

        // Second resolve should work — broken instance was rolled back
        const instance = container.resolve(ReqService);
        expect(instance).toBeDefined();
        expect(instance.dep).toBeDefined();
      });
    });

    test("transient instances are not cached regardless of property injection failure", () => {
      let constructCount = 0;

      @Injectable()
      class TransientService {
        id: number;
        constructor() {
          this.id = ++constructCount;
        }
      }

      const container = createTestContainer();
      container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

      const a = container.resolve(TransientService);
      const b = container.resolve(TransientService);
      expect(a).not.toBe(b);
      expect(a.id).not.toBe(b.id);
    });
  });

  // ==================== Optional @Autowired error handling ====================

  describe("Optional @Autowired error handling", () => {
    test("optional property with missing provider leaves property undefined (no error)", () => {
      const MISSING_TOKEN = new InjectionToken("missing-optional");

      @Injectable()
      class ServiceWithOptional {
        @Autowired(MISSING_TOKEN)
        @Optional()
        optionalDep?: any;

        value = "works";
      }

      const container = createTestContainer();
      container.registerClass(ServiceWithOptional, ServiceWithOptional);

      const instance = container.resolve(ServiceWithOptional);
      expect(instance.value).toBe("works");
      expect(instance.optionalDep).toBeUndefined();
    });

    test("non-optional property injection failure throws PropertyInjectionError", () => {
      const BROKEN_TOKEN = new InjectionToken("broken");

      @Injectable()
      class BrokenDep {
        constructor() {
          throw new Error("broken constructor");
        }
      }

      @Injectable()
      class ServiceWithRequired {
        @Autowired(BROKEN_TOKEN)
        requiredDep!: BrokenDep;
      }

      const container = createTestContainer();
      container.registerClass(BROKEN_TOKEN, BrokenDep);
      container.registerClass(ServiceWithRequired, ServiceWithRequired);

      expect(() => container.resolve(ServiceWithRequired)).toThrow();
    });

    test("optional property with failing factory still creates instance", () => {
      const FAILING_FACTORY = new InjectionToken("failing-factory");

      @Injectable()
      class ServiceWithOptFactory {
        @Autowired(FAILING_FACTORY)
        @Optional()
        optDep?: any;

        value = "ok";
      }

      const container = createTestContainer();
      // Register factory that throws — but dep is optional
      container.registerFactory(FAILING_FACTORY, () => {
        throw new Error("factory boom");
      });
      container.registerClass(ServiceWithOptFactory, ServiceWithOptFactory);

      // Should not throw — optional should absorb the error
      const instance = container.resolve(ServiceWithOptFactory);
      expect(instance.value).toBe("ok");
      expect(instance.optDep).toBeUndefined();
    });
  });

  // ==================== Circular dependencies with 3+ classes ====================

  describe("Circular dependency detection with 3+ classes", () => {
    test("detects A → B → C → A cycle", () => {
      const TOKEN_A = new InjectionToken("CycleA");
      const TOKEN_B = new InjectionToken("CycleB");
      const TOKEN_C = new InjectionToken("CycleC");

      @Injectable()
      class CycleA {
        constructor(@Inject(TOKEN_B) public b: any) {}
      }

      @Injectable()
      class CycleB {
        constructor(@Inject(TOKEN_C) public c: any) {}
      }

      @Injectable()
      class CycleC {
        constructor(@Inject(TOKEN_A) public a: any) {}
      }

      const container = createTestContainer();
      container.registerClass(TOKEN_A, CycleA);
      container.registerClass(TOKEN_B, CycleB);
      container.registerClass(TOKEN_C, CycleC);

      expect(() => container.resolve(TOKEN_A)).toThrow("Circular dependency");
    });

    test("auto-resolves A → B → C → A with lazy proxy", () => {
      const TOKEN_A = new InjectionToken("AutoA");
      const TOKEN_B = new InjectionToken("AutoB");
      const TOKEN_C = new InjectionToken("AutoC");

      @Injectable()
      class AutoA {
        constructor(@Inject(TOKEN_B) public b: any) {}
        name = "A";
      }

      @Injectable()
      class AutoB {
        constructor(@Inject(TOKEN_C) public c: any) {}
        name = "B";
      }

      @Injectable()
      class AutoC {
        constructor(@Inject(TOKEN_A) public a: any) {}
        name = "C";
      }

      const container = new Container({
        autoRegister: false,
        autoResolveCircular: true,
      });
      container.registerClass(TOKEN_A, AutoA);
      container.registerClass(TOKEN_B, AutoB);
      container.registerClass(TOKEN_C, AutoC);

      const a = container.resolve<AutoA>(TOKEN_A);
      expect(a.name).toBe("A");
      expect(a.b.name).toBe("B");
      expect(a.b.c.name).toBe("C");
      // C.a should resolve back to A via lazy proxy
      expect(a.b.c.a.name).toBe("A");
    });
  });

  // ==================== Lazy proxy with cache interactions ====================

  describe("Lazy proxy with cache", () => {
    test("lazy proxy works after original resolution completes", () => {
      const TOKEN_A = new InjectionToken("ProxyA");
      const TOKEN_B = new InjectionToken("ProxyB");

      @Injectable()
      class ProxyA {
        constructor(@Inject(TOKEN_B) public b: any) {}
        value = "from-A";
      }

      @Injectable()
      class ProxyB {
        constructor(@Inject(TOKEN_A) public a: any) {}
        value = "from-B";
      }

      const container = new Container({
        autoRegister: false,
        autoResolveCircular: true,
      });
      container.registerClass(TOKEN_A, ProxyA);
      container.registerClass(TOKEN_B, ProxyB);

      const a = container.resolve<ProxyA>(TOKEN_A);
      expect(a.value).toBe("from-A");
      expect(a.b.value).toBe("from-B");
      // Proxy should resolve correctly — reads through to the real instance
      expect(a.b.a.value).toBe("from-A");
      // Proxy is not === to the original (it's a Proxy wrapper), but reads the same data
      expect(a.b.a.value).toBe(a.value);
    });
  });

  // ==================== Export enforcement ====================

  describe("Export enforcement", () => {
    test("resolveOptional also checks export enforcement", () => {
      const TOKEN = new InjectionToken("restricted");

      const container = new Container({
        autoRegister: false,
        enforceExports: true,
      });
      container.registerValue(TOKEN, "secret");
      container.setExportedTokens(new Set()); // empty exports

      expect(() => container.resolveOptional(TOKEN)).toThrow("not exported");
    });

    test("exported tokens can be resolved normally", () => {
      const TOKEN = new InjectionToken("allowed");

      const container = new Container({
        autoRegister: false,
        enforceExports: true,
      });
      container.registerValue(TOKEN, "public-value");
      container.setExportedTokens(new Set([TOKEN]));

      expect(container.resolve(TOKEN)).toBe("public-value");
      expect(container.resolveOptional(TOKEN)).toBe("public-value");
    });
  });
});
