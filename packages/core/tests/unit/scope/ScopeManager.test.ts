import { beforeEach, describe, expect, test } from "bun:test";
import { ScopeManager } from "../../../src/scope/scope-manager.ts";
import { Scope } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";

describe("ScopeManager", () => {
  let manager: ScopeManager;

  beforeEach(() => {
    manager = new ScopeManager();
  });

  // ── Singleton scope ──────────────────────────────────────────────

  test("singleton: set and get returns cached instance", () => {
    const token = new InjectionToken("A");
    const instance = { value: 42 };

    manager.set(token, Scope.SINGLETON, instance);

    expect(manager.get(token, Scope.SINGLETON)).toBe(instance);
  });

  test("singleton: has returns true for cached token", () => {
    const token = new InjectionToken("B");
    manager.set(token, Scope.SINGLETON, "hello");

    expect(manager.has(token, Scope.SINGLETON)).toBe(true);
    expect(manager.has(new InjectionToken("missing"), Scope.SINGLETON)).toBe(false);
  });

  // ── Transient scope ──────────────────────────────────────────────

  test("transient: get always returns undefined", () => {
    const token = new InjectionToken("T");
    manager.set(token, Scope.TRANSIENT, { value: 1 });

    expect(manager.get(token, Scope.TRANSIENT)).toBeUndefined();
  });

  test("transient: has always returns false", () => {
    const token = new InjectionToken("T2");
    manager.set(token, Scope.TRANSIENT, { value: 1 });

    expect(manager.has(token, Scope.TRANSIENT)).toBe(false);
  });

  // ── Request scope ────────────────────────────────────────────────

  test("request: get/set works within run() context", () => {
    const token = new InjectionToken("R");
    const instance = { req: true };
    const storage = manager.getRequestStorage();

    storage.run(() => {
      manager.set(token, Scope.REQUEST, instance);

      expect(manager.get(token, Scope.REQUEST)).toBe(instance);
      expect(manager.has(token, Scope.REQUEST)).toBe(true);
    });
  });

  test("request: get returns undefined outside of request context", () => {
    const token = new InjectionToken("R2");

    expect(manager.get(token, Scope.REQUEST)).toBeUndefined();
  });

  // ── Custom scope ─────────────────────────────────────────────────

  test("custom scope: registerCustomScope and use it", () => {
    const cache = new Map<any, any>();
    const handler = {
      get: (token: any) => cache.get(token),
      set: (token: any, instance: any) => {
        cache.set(token, instance);
      },
      has: (token: any) => cache.has(token),
      clear: () => {
        cache.clear();
      },
    };

    manager.registerCustomScope("worker", handler);

    const token = new InjectionToken("W");
    const instance = { worker: true };

    manager.set(token, "worker", instance);
    expect(manager.get(token, "worker")).toBe(instance);
    expect(manager.has(token, "worker")).toBe(true);
  });

  test("registerCustomScope throws for built-in scope names", () => {
    const dummyHandler = {
      get: () => undefined,
      set: () => {},
      has: () => false,
      clear: () => {},
    };

    expect(() => manager.registerCustomScope("singleton", dummyHandler)).toThrow(
      /conflicts with built-in scope/,
    );
    expect(() => manager.registerCustomScope("transient", dummyHandler)).toThrow(
      /conflicts with built-in scope/,
    );
    expect(() => manager.registerCustomScope("request", dummyHandler)).toThrow(
      /conflicts with built-in scope/,
    );
  });

  test("hasCustomScope returns true/false correctly", () => {
    expect(manager.hasCustomScope("session")).toBe(false);

    manager.registerCustomScope("session", {
      get: () => undefined,
      set: () => {},
      has: () => false,
      clear: () => {},
    });

    expect(manager.hasCustomScope("session")).toBe(true);
  });

  // ── Clearing caches ──────────────────────────────────────────────

  test("clearScope clears singleton cache", () => {
    const token = new InjectionToken("CS");
    manager.set(token, Scope.SINGLETON, "value");
    expect(manager.has(token, Scope.SINGLETON)).toBe(true);

    manager.clearScope(Scope.SINGLETON);

    expect(manager.has(token, Scope.SINGLETON)).toBe(false);
    expect(manager.getSingletonCacheSize()).toBe(0);
  });

  test("clearScope clears request cache", () => {
    const token = new InjectionToken("CR");
    const storage = manager.getRequestStorage();

    storage.run(() => {
      manager.set(token, Scope.REQUEST, "value");
      expect(manager.has(token, Scope.REQUEST)).toBe(true);

      manager.clearScope(Scope.REQUEST);

      expect(manager.has(token, Scope.REQUEST)).toBe(false);
      expect(manager.getRequestCacheSize()).toBe(0);
    });
  });

  test("clearAll clears everything", () => {
    const sToken = new InjectionToken("CA-S");
    manager.set(sToken, Scope.SINGLETON, "s");
    manager.trackForDestroy(sToken, { onDestroy: () => {} });

    manager.clearAll();

    expect(manager.has(sToken, Scope.SINGLETON)).toBe(false);
    expect(manager.getSingletonCacheSize()).toBe(0);
  });

  // ── Destroy lifecycle ────────────────────────────────────────────

  test("trackForDestroy + destroyAll calls onDestroy in LIFO order", async () => {
    const order: string[] = [];

    const instanceA = {
      onDestroy: () => {
        order.push("A");
      },
    };
    const instanceB = {
      onDestroy: () => {
        order.push("B");
      },
    };
    const instanceC = {
      onDestroy: () => {
        order.push("C");
      },
    };

    manager.trackForDestroy("a", instanceA);
    manager.trackForDestroy("b", instanceB);
    manager.trackForDestroy("c", instanceC);

    const errors = await manager.destroyAll();

    expect(errors).toHaveLength(0);
    expect(order).toEqual(["C", "B", "A"]);
  });

  test("destroyAll returns errors from failed onDestroy hooks", async () => {
    const instanceOk = { onDestroy: () => {} };
    const instanceFail = {
      onDestroy: () => {
        throw new Error("destroy failed");
      },
    };

    manager.trackForDestroy("ok", instanceOk);
    manager.trackForDestroy("fail", instanceFail);

    const errors = await manager.destroyAll();

    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe("destroy failed");
  });

  test("destroyAll clears caches after execution", async () => {
    const token = new InjectionToken("DC");
    manager.set(token, Scope.SINGLETON, "value");
    manager.trackForDestroy(token, { onDestroy: () => {} });

    await manager.destroyAll();

    expect(manager.getSingletonCacheSize()).toBe(0);
    expect(manager.has(token, Scope.SINGLETON)).toBe(false);
  });

  // ── Utilities ────────────────────────────────────────────────────

  test("getStats returns correct counts", () => {
    manager.set(new InjectionToken("s1"), Scope.SINGLETON, 1);
    manager.set(new InjectionToken("s2"), Scope.SINGLETON, 2);

    const stats = manager.getStats();
    expect(stats.singletonCount).toBe(2);
    expect(stats.requestCount).toBe(0);
  });

  test("getSingletonCacheSize / getRequestCacheSize", () => {
    expect(manager.getSingletonCacheSize()).toBe(0);
    expect(manager.getRequestCacheSize()).toBe(0);

    manager.set(new InjectionToken("x"), Scope.SINGLETON, "x");
    expect(manager.getSingletonCacheSize()).toBe(1);

    const storage = manager.getRequestStorage();
    storage.run(() => {
      manager.set(new InjectionToken("r"), Scope.REQUEST, "r");
      expect(manager.getRequestCacheSize()).toBe(1);
    });
  });
});
