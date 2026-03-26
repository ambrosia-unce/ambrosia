import { beforeEach, describe, expect, test } from "bun:test";
import { Container } from "../../../src/container/container.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { PackLifecycleManager } from "../../../src/pack/pack-lifecycle.ts";
import { PackProcessor } from "../../../src/pack/pack-processor.ts";
import { packRegistry } from "../../../src/pack/pack-registry.ts";
import type { PackDefinition } from "../../../src/pack/types.ts";
import { DEFAULT_SCOPE } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import { cleanRegistry } from "../../helpers/test-helpers.ts";

@Injectable()
class ServiceA {}

@Injectable()
class ServiceB {}

@Injectable()
class ServiceC {}

@Injectable()
class ServiceD {}

const TOKEN_A = new InjectionToken<string>("TOKEN_A");
const TOKEN_B = new InjectionToken<string>("TOKEN_B");

describe("PackProcessor", () => {
  let processor: PackProcessor;

  beforeEach(() => {
    cleanRegistry();
    packRegistry.clear();
    processor = new PackProcessor();
  });

  // 1. process empty array returns empty providers
  test("process empty array returns empty providers and exportedTokens", () => {
    const result = processor.process([]);
    expect(result.providers).toEqual([]);
    expect(result.exportedTokens.size).toBe(0);
  });

  // 2. process single pack with providers
  test("process single pack with provider objects", () => {
    const pack: PackDefinition = {
      meta: { name: "test-pack" },
      providers: [{ token: TOKEN_A, useValue: "hello" }],
    };

    const result = processor.process([pack]);
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]).toEqual({ token: TOKEN_A, useValue: "hello" });
  });

  // 3. Constructor shorthand normalized to ClassProvider
  test("Constructor shorthand is normalized to ClassProvider with DEFAULT_SCOPE", () => {
    const pack: PackDefinition = {
      meta: { name: "ctor-pack" },
      providers: [ServiceA],
    };

    const result = processor.process([pack]);
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
  });

  // 4. Falsy packs filtered out (null, undefined, false)
  test("falsy packs (null, undefined, false) are filtered out", () => {
    const pack: PackDefinition = {
      meta: { name: "real-pack" },
      providers: [ServiceA],
    };

    const result = processor.process([null, undefined, false, pack]);
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
  });

  // 5. imports processed depth-first before current pack
  test("imports are processed depth-first before current pack providers", () => {
    const importedPack: PackDefinition = {
      meta: { name: "imported" },
      providers: [{ token: TOKEN_A, useValue: "from-import" }],
    };

    const mainPack: PackDefinition = {
      meta: { name: "main" },
      imports: [importedPack],
      providers: [{ token: TOKEN_B, useValue: "from-main" }],
    };

    const result = processor.process([mainPack]);
    expect(result.providers).toHaveLength(2);
    // Imported pack's provider comes first (depth-first)
    expect(result.providers[0]).toEqual({ token: TOKEN_A, useValue: "from-import" });
    expect(result.providers[1]).toEqual({ token: TOKEN_B, useValue: "from-main" });
  });

  // 6. Deduplication: same pack processed only once
  test("same pack object is processed only once (deduplication)", () => {
    const sharedPack: PackDefinition = {
      meta: { name: "shared" },
      providers: [{ token: TOKEN_A, useValue: "shared-value" }],
    };

    const result = processor.process([sharedPack, sharedPack]);
    expect(result.providers).toHaveLength(1);
  });

  // 7. exports: only specified tokens in exportedTokens
  test("only specified exports are in exportedTokens", () => {
    const pack: PackDefinition = {
      meta: { name: "selective-export" },
      providers: [
        { token: TOKEN_A, useValue: "a" },
        { token: TOKEN_B, useValue: "b" },
      ],
      exports: [TOKEN_A],
    };

    const result = processor.process([pack]);
    expect(result.exportedTokens.has(TOKEN_A)).toBe(true);
    expect(result.exportedTokens.has(TOKEN_B)).toBe(false);
  });

  // 8. exports: all tokens exported when exports not specified
  test("all tokens are exported when exports array is not specified", () => {
    const pack: PackDefinition = {
      meta: { name: "export-all" },
      providers: [
        { token: TOKEN_A, useValue: "a" },
        { token: TOKEN_B, useValue: "b" },
      ],
    };

    const result = processor.process([pack]);
    expect(result.exportedTokens.has(TOKEN_A)).toBe(true);
    expect(result.exportedTokens.has(TOKEN_B)).toBe(true);
  });

  // 9. Warns when exporting token not in providers (no crash)
  test("does not crash when exporting a token not provided by the pack", () => {
    const unknownToken = new InjectionToken("UNKNOWN");
    const pack: PackDefinition = {
      meta: { name: "bad-export" },
      providers: [{ token: TOKEN_A, useValue: "a" }],
      exports: [unknownToken],
    };

    // Should not throw, but unprovided token should NOT be in exportedTokens
    const result = processor.process([pack]);
    expect(result.exportedTokens.has(unknownToken)).toBe(false);
  });

  // 10. lazyImports resolved and processed
  test("lazyImports are resolved and processed", () => {
    const lazyPack: PackDefinition = {
      meta: { name: "lazy" },
      providers: [{ token: TOKEN_A, useValue: "lazy-value" }],
    };

    const mainPack: PackDefinition = {
      meta: { name: "main" },
      lazyImports: () => [lazyPack],
      providers: [{ token: TOKEN_B, useValue: "main-value" }],
    };

    const result = processor.process([mainPack]);
    expect(result.providers).toHaveLength(2);
    // Lazy imports processed before current pack's providers
    expect(result.providers[0]).toEqual({ token: TOKEN_A, useValue: "lazy-value" });
    expect(result.providers[1]).toEqual({ token: TOKEN_B, useValue: "main-value" });
  });

  // 11. Circular import detection (pack imports itself)
  test("circular import (pack imports itself) warns but does not crash", () => {
    const selfPack: PackDefinition = {
      meta: { name: "self-ref" },
      providers: [{ token: TOKEN_A, useValue: "self" }],
    };
    selfPack.imports = [selfPack];

    // Should not throw
    const result = processor.process([selfPack]);
    expect(result.providers).toHaveLength(1);
  });

  // 12. Nested imports: A imports B, B imports C
  test("nested imports: A imports B, B imports C, all processed depth-first", () => {
    const packC: PackDefinition = {
      meta: { name: "C" },
      providers: [ServiceC],
    };

    const packB: PackDefinition = {
      meta: { name: "B" },
      imports: [packC],
      providers: [ServiceB],
    };

    const packA: PackDefinition = {
      meta: { name: "A" },
      imports: [packB],
      providers: [ServiceA],
    };

    const result = processor.process([packA]);
    expect(result.providers).toHaveLength(3);
    // Depth-first: C first, then B, then A
    expect(result.providers[0]).toEqual({
      token: ServiceC,
      useClass: ServiceC,
      scope: DEFAULT_SCOPE,
    });
    expect(result.providers[1]).toEqual({
      token: ServiceB,
      useClass: ServiceB,
      scope: DEFAULT_SCOPE,
    });
    expect(result.providers[2]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
  });

  // 13. Diamond imports: D imports B and C, both import A — A processed once
  test("diamond imports: shared dependency is processed only once", () => {
    const packA: PackDefinition = {
      meta: { name: "A" },
      providers: [ServiceA],
    };

    const packB: PackDefinition = {
      meta: { name: "B" },
      imports: [packA],
      providers: [ServiceB],
    };

    const packC: PackDefinition = {
      meta: { name: "C" },
      imports: [packA],
      providers: [ServiceC],
    };

    const packD: PackDefinition = {
      meta: { name: "D" },
      imports: [packB, packC],
      providers: [ServiceD],
    };

    const result = processor.process([packD]);
    // A should appear only once even though imported by both B and C
    const aProviders = result.providers.filter((p) => "useClass" in p && p.useClass === ServiceA);
    expect(aProviders).toHaveLength(1);
    expect(result.providers).toHaveLength(4);
  });

  // 14. Pack with meta.name registered in packRegistry
  test("pack with meta.name is registered in packRegistry under that name", () => {
    const pack: PackDefinition = {
      meta: { name: "my-pack" },
      providers: [ServiceA],
    };

    processor.process([pack]);
    expect(packRegistry.has("my-pack")).toBe(true);
    const info = packRegistry.get("my-pack");
    expect(info).toBeDefined();
    expect(info!.pack).toBe(pack);
  });

  // 15. Anonymous pack gets auto-generated name
  test("anonymous pack (no meta.name) gets auto-generated name in registry", () => {
    const pack: PackDefinition = {
      providers: [ServiceA],
    };

    processor.process([pack]);
    expect(packRegistry.count()).toBe(1);
    const all = packRegistry.getAll();
    expect(all[0]!.metadata.name).toMatch(/^anonymous-\d+$/);
  });

  // 16. getLifecycleManager returns manager
  test("getLifecycleManager returns a PackLifecycleManager instance", () => {
    const manager = processor.getLifecycleManager();
    expect(manager).toBeInstanceOf(PackLifecycleManager);
  });

  // 17. onInit hook registered via lifecycle manager
  test("onInit hook is registered via the lifecycle manager", async () => {
    let initCalled = false;

    const pack: PackDefinition = {
      meta: { name: "init-pack" },
      providers: [ServiceA],
      onInit: () => {
        initCalled = true;
      },
    };

    processor.process([pack]);

    const manager = processor.getLifecycleManager();
    // Execute init hooks to verify registration
    const mockContainer = {} as any;
    await manager.executeInit(mockContainer);
    expect(initCalled).toBe(true);
  });

  // 18. onDestroy hook registered via lifecycle manager
  test("onDestroy hook is registered via the lifecycle manager", async () => {
    let destroyCalled = false;

    const pack: PackDefinition = {
      meta: { name: "destroy-pack" },
      providers: [ServiceA],
      onDestroy: () => {
        destroyCalled = true;
      },
    };

    processor.process([pack]);

    const manager = processor.getLifecycleManager();
    await manager.executeDestroy();
    expect(destroyCalled).toBe(true);
  });

  // 19. registerInContainer registers providers
  test("registerInContainer registers providers into the container", () => {
    const container = new Container(false);
    const providers = [
      { token: TOKEN_A, useValue: "value-a" } as const,
      { token: TOKEN_B, useValue: "value-b" } as const,
    ];

    PackProcessor.registerInContainer(container, providers);
    expect(container.has(TOKEN_A)).toBe(true);
    expect(container.has(TOKEN_B)).toBe(true);
  });

  // 20. registerInContainer skips already-registered tokens
  test("registerInContainer skips tokens already registered in the container", () => {
    const container = new Container(false);
    const originalProvider = { token: TOKEN_A, useValue: "original" } as const;
    const duplicateProvider = { token: TOKEN_A, useValue: "duplicate" } as const;

    // Register the original first
    PackProcessor.registerInContainer(container, [originalProvider]);
    // Try to register the duplicate
    PackProcessor.registerInContainer(container, [duplicateProvider]);

    // The original should remain (resolve to check)
    expect(container.has(TOKEN_A)).toBe(true);
    const resolved = container.resolve(TOKEN_A);
    expect(resolved).toBe("original");
  });

  // 21. Multiple packs with overlapping providers
  test("multiple packs with overlapping providers collect all providers in order", () => {
    const pack1: PackDefinition = {
      meta: { name: "pack1" },
      providers: [ServiceA, { token: TOKEN_A, useValue: "val-a" }],
    };

    const pack2: PackDefinition = {
      meta: { name: "pack2" },
      providers: [ServiceA, { token: TOKEN_B, useValue: "val-b" }],
    };

    const result = processor.process([pack1, pack2]);
    // Both packs' providers are collected (pack2 not deduplicated because it's a different pack)
    expect(result.providers).toHaveLength(4);
  });

  // 22. Pack with mixed providers (Constructor + Provider objects)
  test("pack with mixed Constructor and Provider objects normalizes correctly", () => {
    const pack: PackDefinition = {
      meta: { name: "mixed" },
      providers: [
        ServiceA,
        { token: TOKEN_A, useValue: "string-value" },
        ServiceB,
        { token: TOKEN_B, useFactory: () => 42 },
      ],
    };

    const result = processor.process([pack]);
    expect(result.providers).toHaveLength(4);

    // Constructor providers are normalized
    expect(result.providers[0]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
    // Plain provider objects pass through
    expect(result.providers[1]).toEqual({ token: TOKEN_A, useValue: "string-value" });
    expect(result.providers[2]).toEqual({
      token: ServiceB,
      useClass: ServiceB,
      scope: DEFAULT_SCOPE,
    });
    expect(result.providers[3]).toEqual({ token: TOKEN_B, useFactory: expect.any(Function) });
  });

  // 23. Pack with no providers
  test("pack with no providers contributes no providers but is still registered", () => {
    const pack: PackDefinition = {
      meta: { name: "empty" },
    };

    const result = processor.process([pack]);
    expect(result.providers).toHaveLength(0);
    expect(packRegistry.has("empty")).toBe(true);
  });

  // 24. Conditional imports (some falsy in imports array)
  test("falsy values in imports array are filtered out", () => {
    const importedPack: PackDefinition = {
      meta: { name: "imported" },
      providers: [ServiceA],
    };

    const mainPack: PackDefinition = {
      meta: { name: "main" },
      imports: [null, importedPack, undefined, false],
      providers: [ServiceB],
    };

    const result = processor.process([mainPack]);
    expect(result.providers).toHaveLength(2);
    // Only the real imported pack and main pack providers
    expect(result.providers[0]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
    expect(result.providers[1]).toEqual({
      token: ServiceB,
      useClass: ServiceB,
      scope: DEFAULT_SCOPE,
    });
  });

  // 25b. registerInContainer passes exportedTokens
  test("registerInContainer passes exportedTokens to container", () => {
    const container = new Container({
      autoRegister: false,
      enforceExports: true,
    });

    const exported = new Set<any>([TOKEN_A]);
    const providers = [
      { token: TOKEN_A, useValue: "value-a" } as const,
      { token: TOKEN_B, useValue: "value-b" } as const,
    ];

    PackProcessor.registerInContainer(container, providers, exported);

    // TOKEN_A is exported — should resolve
    expect(container.resolve(TOKEN_A)).toBe("value-a");

    // TOKEN_B is not exported — should throw
    expect(() => container.resolve(TOKEN_B)).toThrow("not exported");
  });

  // 25. lazyImports with falsy values filtered
  test("falsy values returned by lazyImports are filtered out", () => {
    const lazyPack: PackDefinition = {
      meta: { name: "lazy-real" },
      providers: [ServiceA],
    };

    const mainPack: PackDefinition = {
      meta: { name: "main" },
      lazyImports: () => [null, lazyPack, undefined, false],
      providers: [ServiceB],
    };

    const result = processor.process([mainPack]);
    expect(result.providers).toHaveLength(2);
    expect(result.providers[0]).toEqual({
      token: ServiceA,
      useClass: ServiceA,
      scope: DEFAULT_SCOPE,
    });
    expect(result.providers[1]).toEqual({
      token: ServiceB,
      useClass: ServiceB,
      scope: DEFAULT_SCOPE,
    });
  });
});
