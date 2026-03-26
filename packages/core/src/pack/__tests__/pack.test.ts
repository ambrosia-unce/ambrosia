import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Container } from "../../container/container.ts";
import { Registry } from "../../container/registry.ts";
import { Injectable } from "../../decorators/injectable.ts";
import { AmbrosiaError } from "../../errors/ambrosia-error.ts";
import { Scope } from "../../scope/types.ts";
import { InjectionToken } from "../../types/token.ts";
import { definePack } from "../define-pack.ts";
import { PackLifecycleManager } from "../pack-lifecycle.ts";
import { PackProcessor } from "../pack-processor.ts";
import { packRegistry } from "../pack-registry.ts";
import type { PackDefinition } from "../types.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function freshContainer() {
  return new Container({ autoRegister: false });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Pack System", () => {
  beforeEach(() => {
    Registry.reset();
    packRegistry.clear();
  });

  afterEach(() => {
    Registry.reset();
    packRegistry.clear();
  });

  // ==================== definePack ====================

  describe("definePack", () => {
    it("should create a correct pack structure", () => {
      const pack = definePack({
        meta: { name: "test-pack" },
        providers: [],
        exports: [],
      });

      expect(pack).toBeDefined();
      expect(pack.meta?.name).toBe("test-pack");
      expect(pack.providers).toEqual([]);
      expect(pack.exports).toEqual([]);
    });

    it("should pass through all fields unchanged", () => {
      const onInit = mock(() => {});
      const onDestroy = mock(() => {});

      const pack = definePack({
        meta: { name: "full", version: "1.0.0", description: "A pack", tags: ["test"] },
        providers: [],
        exports: [],
        imports: [],
        onInit,
        onDestroy,
      });

      expect(pack.meta?.version).toBe("1.0.0");
      expect(pack.meta?.description).toBe("A pack");
      expect(pack.meta?.tags).toEqual(["test"]);
      expect(pack.onInit).toBe(onInit);
      expect(pack.onDestroy).toBe(onDestroy);
    });
  });

  // ==================== Pack with providers ====================

  describe("Pack with providers", () => {
    it("should register all providers and make them resolvable", () => {
      class ServiceA {
        value = "a";
      }
      class ServiceB {
        value = "b";
      }

      const pack = definePack({
        meta: { name: "svc-pack" },
        providers: [
          { token: ServiceA, useClass: ServiceA, scope: Scope.SINGLETON },
          { token: ServiceB, useClass: ServiceB, scope: Scope.SINGLETON },
        ],
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      expect(container.resolve(ServiceA).value).toBe("a");
      expect(container.resolve(ServiceB).value).toBe("b");
    });

    it("should support bare constructor shorthand", () => {
      class BareClass {
        x = 1;
      }

      const pack = definePack({
        meta: { name: "bare" },
        providers: [BareClass],
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      expect(container.resolve(BareClass).x).toBe(1);
    });
  });

  // ==================== Pack exports (encapsulation) ====================

  describe("Pack exports (encapsulation)", () => {
    it("should track exported tokens", () => {
      class Public {}
      class Internal {}

      const pack = definePack({
        meta: { name: "enc-pack" },
        providers: [
          { token: Public, useClass: Public, scope: Scope.SINGLETON },
          { token: Internal, useClass: Internal, scope: Scope.SINGLETON },
        ],
        exports: [Public],
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);

      expect(result.exportedTokens.has(Public)).toBe(true);
      expect(result.exportedTokens.has(Internal)).toBe(false);
    });

    it("should export all when no exports specified", () => {
      class A {}
      class B {}

      const pack = definePack({
        meta: { name: "all-export" },
        providers: [
          { token: A, useClass: A, scope: Scope.SINGLETON },
          { token: B, useClass: B, scope: Scope.SINGLETON },
        ],
        // no exports field
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);

      expect(result.exportedTokens.has(A)).toBe(true);
      expect(result.exportedTokens.has(B)).toBe(true);
    });

    it("should enforce exports when container has enforceExports enabled", () => {
      class Exported {}
      class NotExported {}

      const pack = definePack({
        meta: { name: "enforce" },
        providers: [
          { token: Exported, useClass: Exported, scope: Scope.SINGLETON },
          { token: NotExported, useClass: NotExported, scope: Scope.SINGLETON },
        ],
        exports: [Exported],
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);
      const container = new Container({ autoRegister: false, enforceExports: true });
      PackProcessor.registerInContainer(container, result.providers, result.exportedTokens);

      expect(container.resolve(Exported)).toBeInstanceOf(Exported);
      expect(() => container.resolve(NotExported)).toThrow(AmbrosiaError);
    });
  });

  // ==================== Pack imports ====================

  describe("Pack imports (cross-pack resolution)", () => {
    it("should process imports depth-first", () => {
      const order: string[] = [];

      class DepService {
        v = "dep";
      }
      class MainService {
        v = "main";
      }

      const depPack = definePack({
        meta: { name: "dep" },
        providers: [{ token: DepService, useClass: DepService, scope: Scope.SINGLETON }],
        onInit: () => {
          order.push("dep");
        },
      });

      const mainPack = definePack({
        meta: { name: "main" },
        imports: [depPack],
        providers: [{ token: MainService, useClass: MainService, scope: Scope.SINGLETON }],
        onInit: () => {
          order.push("main");
        },
      });

      const processor = new PackProcessor();
      const result = processor.process([mainPack]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      // Both should be resolvable
      expect(container.resolve(DepService).v).toBe("dep");
      expect(container.resolve(MainService).v).toBe("main");

      // Providers from dep should come first (depth-first)
      const depIdx = result.providers.findIndex((p) => p.token === DepService);
      const mainIdx = result.providers.findIndex((p) => p.token === MainService);
      expect(depIdx).toBeLessThan(mainIdx);
    });

    it("should deduplicate shared imports", () => {
      class SharedService {}

      const shared = definePack({
        meta: { name: "shared" },
        providers: [{ token: SharedService, useClass: SharedService, scope: Scope.SINGLETON }],
      });

      const packA = definePack({
        meta: { name: "a" },
        imports: [shared],
      });

      const packB = definePack({
        meta: { name: "b" },
        imports: [shared],
      });

      const root = definePack({
        meta: { name: "root" },
        imports: [packA, packB],
      });

      const processor = new PackProcessor();
      const result = processor.process([root]);

      // SharedService should appear exactly once
      const count = result.providers.filter((p) => p.token === SharedService).length;
      expect(count).toBe(1);
    });
  });

  // ==================== Circular import detection ====================

  describe("Pack import cycle detection", () => {
    it("should warn but not crash on circular pack imports", () => {
      // Create two packs that import each other via lazyImports
      const packA: PackDefinition = {
        meta: { name: "cycle-a" },
        providers: [],
      };

      const packB: PackDefinition = {
        meta: { name: "cycle-b" },
        imports: [packA],
      };

      // Make A import B (creates cycle)
      packA.imports = [packB];

      const processor = new PackProcessor();
      // Should not throw, just warn
      const result = processor.process([packA]);
      expect(result).toBeDefined();
    });
  });

  // ==================== Lazy imports ====================

  describe("Lazy imports", () => {
    it("should resolve lazy imports at processing time", () => {
      class LazyService {
        ok = true;
      }

      const lazyPack = definePack({
        meta: { name: "lazy-dep" },
        providers: [{ token: LazyService, useClass: LazyService, scope: Scope.SINGLETON }],
      });

      const mainPack = definePack({
        meta: { name: "lazy-main" },
        lazyImports: () => [lazyPack],
      });

      const processor = new PackProcessor();
      const result = processor.process([mainPack]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      expect(container.resolve(LazyService).ok).toBe(true);
    });

    it("should break circular pack deps with lazy imports", () => {
      class SvcX {}
      class SvcY {}

      const packX: PackDefinition = {
        meta: { name: "x" },
        providers: [{ token: SvcX, useClass: SvcX, scope: Scope.SINGLETON }],
      };

      const packY: PackDefinition = {
        meta: { name: "y" },
        providers: [{ token: SvcY, useClass: SvcY, scope: Scope.SINGLETON }],
        lazyImports: () => [packX],
      };

      packX.imports = [packY];

      const processor = new PackProcessor();
      // Should not throw
      const result = processor.process([packX]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      expect(container.resolve(SvcX)).toBeInstanceOf(SvcX);
      expect(container.resolve(SvcY)).toBeInstanceOf(SvcY);
    });
  });

  // ==================== Lifecycle hooks ====================

  describe("onInit lifecycle hook", () => {
    it("should call onInit during executeInit", async () => {
      const initFn = mock(() => {});

      const pack = definePack({
        meta: { name: "init-pack" },
        providers: [],
        onInit: initFn,
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      const container = freshContainer();
      await processor.getLifecycleManager().executeInit(container);

      expect(initFn).toHaveBeenCalledTimes(1);
    });

    it("should pass container to onInit", async () => {
      let receivedContainer: any = null;

      const pack = definePack({
        meta: { name: "init-container" },
        providers: [],
        onInit: (c) => {
          receivedContainer = c;
        },
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      const container = freshContainer();
      await processor.getLifecycleManager().executeInit(container);

      expect(receivedContainer).toBe(container);
    });

    it("should throw AmbrosiaError if onInit fails", async () => {
      const pack = definePack({
        meta: { name: "failing-init" },
        providers: [],
        onInit: () => {
          throw new Error("init boom");
        },
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      const container = freshContainer();
      try {
        await processor.getLifecycleManager().executeInit(container);
        expect(true).toBe(false); // should not reach
      } catch (e) {
        expect(e).toBeInstanceOf(AmbrosiaError);
        expect((e as AmbrosiaError).code).toBe("AMB103");
      }
    });
  });

  describe("onDestroy lifecycle hook", () => {
    it("should call onDestroy during executeDestroy", async () => {
      const destroyFn = mock(() => {});

      const pack = definePack({
        meta: { name: "destroy-pack" },
        providers: [],
        onDestroy: destroyFn,
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      await processor.getLifecycleManager().executeDestroy();

      expect(destroyFn).toHaveBeenCalledTimes(1);
    });

    it("should call onDestroy in reverse order (LIFO)", async () => {
      const order: string[] = [];

      const first = definePack({
        meta: { name: "first" },
        providers: [],
        onDestroy: () => {
          order.push("first");
        },
      });

      const second = definePack({
        meta: { name: "second" },
        providers: [],
        onDestroy: () => {
          order.push("second");
        },
      });

      const processor = new PackProcessor();
      processor.process([first, second]);

      await processor.getLifecycleManager().executeDestroy();

      expect(order).toEqual(["second", "first"]);
    });

    it("should not throw if onDestroy fails (graceful)", async () => {
      const pack = definePack({
        meta: { name: "destroy-fail" },
        providers: [],
        onDestroy: () => {
          throw new Error("destroy boom");
        },
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      // Should not throw
      await processor.getLifecycleManager().executeDestroy();
    });
  });

  // ==================== Pack not exported error ====================

  describe("Provider not exported error (AMB007)", () => {
    it("should throw AMB007 when resolving non-exported provider with enforceExports", () => {
      class Secret {}

      const pack = definePack({
        meta: { name: "secret-pack" },
        providers: [{ token: Secret, useClass: Secret, scope: Scope.SINGLETON }],
        exports: [], // exports nothing
      });

      const processor = new PackProcessor();
      const result = processor.process([pack]);
      const container = new Container({ autoRegister: false, enforceExports: true });
      PackProcessor.registerInContainer(container, result.providers, result.exportedTokens);

      try {
        container.resolve(Secret);
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(AmbrosiaError);
        expect((e as AmbrosiaError).code).toBe("AMB007");
      }
    });
  });

  // ==================== Falsy pack filtering ====================

  describe("Falsy pack filtering", () => {
    it("should skip null/undefined/false packs", () => {
      class Svc {}

      const realPack = definePack({
        meta: { name: "real" },
        providers: [{ token: Svc, useClass: Svc, scope: Scope.SINGLETON }],
      });

      const processor = new PackProcessor();
      const result = processor.process([null, undefined, false, realPack]);
      const container = freshContainer();
      PackProcessor.registerInContainer(container, result.providers);

      expect(container.resolve(Svc)).toBeInstanceOf(Svc);
    });
  });

  // ==================== PackRegistry introspection ====================

  describe("PackRegistry", () => {
    it("should register packs and provide introspection", () => {
      const pack = definePack({
        meta: { name: "intro-pack", version: "2.0", tags: ["db"] },
        providers: [],
      });

      const processor = new PackProcessor();
      processor.process([pack]);

      expect(packRegistry.has("intro-pack")).toBe(true);
      const info = packRegistry.get("intro-pack");
      expect(info).toBeDefined();
      expect(info!.metadata.name).toBe("intro-pack");
      expect(info!.metadata.version).toBe("2.0");
    });

    it("should assign anonymous names to unnamed packs", () => {
      const pack = definePack({ providers: [] });

      const processor = new PackProcessor();
      processor.process([pack]);

      const all = packRegistry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(1);
      const anonymous = all.find((p) => p.metadata.name.startsWith("anonymous-"));
      expect(anonymous).toBeDefined();
    });
  });
});
