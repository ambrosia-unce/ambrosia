/**
 * ScopeManager.delete() Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { ScopeManager } from "../../../src/scope/scope-manager.ts";
import { Scope } from "../../../src/scope/types.ts";
import { InjectionToken } from "../../../src/types/token.ts";

describe("ScopeManager.delete", () => {
  let manager: ScopeManager;

  beforeEach(() => {
    manager = new ScopeManager();
  });

  test("deletes singleton instance", () => {
    const token = new InjectionToken("del-singleton");
    manager.set(token, Scope.SINGLETON, "value");
    expect(manager.get(token, Scope.SINGLETON)).toBe("value");

    expect(manager.delete(token, Scope.SINGLETON)).toBe(true);
    expect(manager.get(token, Scope.SINGLETON)).toBeUndefined();
  });

  test("returns false when deleting non-existent singleton", () => {
    const token = new InjectionToken("missing");
    expect(manager.delete(token, Scope.SINGLETON)).toBe(false);
  });

  test("deletes request-scoped instance", () => {
    const token = new InjectionToken("del-request");

    manager.getRequestStorage().run(() => {
      manager.set(token, Scope.REQUEST, "req-value");
      expect(manager.get(token, Scope.REQUEST)).toBe("req-value");

      expect(manager.delete(token, Scope.REQUEST)).toBe(true);
      expect(manager.get(token, Scope.REQUEST)).toBeUndefined();
    });
  });

  test("returns false when deleting request-scoped without active scope", () => {
    const token = new InjectionToken("no-scope");
    expect(manager.delete(token, Scope.REQUEST)).toBe(false);
  });

  test("returns false for transient scope (never cached)", () => {
    const token = new InjectionToken("transient");
    expect(manager.delete(token, Scope.TRANSIENT)).toBe(false);
  });
});
