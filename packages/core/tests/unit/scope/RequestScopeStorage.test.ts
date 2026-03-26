/**
 * RequestScopeStorage Tests
 *
 * Tests for request scope storage behavior including:
 * - get/has return gracefully when no active scope (no throw)
 * - delete method
 * - set still throws without active scope
 */

import { describe, expect, test } from "bun:test";
import "reflect-metadata";
import { NoRequestScopeError } from "../../../src/container/errors.ts";
import { RequestScopeStorage } from "../../../src/scope/request-scope-storage.ts";
import { InjectionToken } from "../../../src/types/token.ts";

describe("RequestScopeStorage", () => {
  const storage = new RequestScopeStorage();
  const TOKEN = new InjectionToken<string>("test");

  describe("without active scope", () => {
    test("get() returns undefined instead of throwing", () => {
      expect(storage.get(TOKEN)).toBeUndefined();
    });

    test("has() returns false instead of throwing", () => {
      expect(storage.has(TOKEN)).toBe(false);
    });

    test("set() still throws NoRequestScopeError", () => {
      expect(() => storage.set(TOKEN, "value")).toThrow(NoRequestScopeError);
    });

    test("delete() returns false without throwing", () => {
      expect(storage.delete(TOKEN)).toBe(false);
    });

    test("hasActiveScope() returns false", () => {
      expect(storage.hasActiveScope()).toBe(false);
    });

    test("size() returns 0", () => {
      expect(storage.size()).toBe(0);
    });

    test("clear() does not throw", () => {
      expect(() => storage.clear()).not.toThrow();
    });
  });

  describe("with active scope", () => {
    test("basic get/set/has/delete cycle", () => {
      storage.run(() => {
        expect(storage.hasActiveScope()).toBe(true);

        // Initially empty
        expect(storage.has(TOKEN)).toBe(false);
        expect(storage.get(TOKEN)).toBeUndefined();

        // Set
        storage.set(TOKEN, "hello");
        expect(storage.has(TOKEN)).toBe(true);
        expect(storage.get(TOKEN)).toBe("hello");
        expect(storage.size()).toBe(1);

        // Delete
        expect(storage.delete(TOKEN)).toBe(true);
        expect(storage.has(TOKEN)).toBe(false);
        expect(storage.get(TOKEN)).toBeUndefined();
        expect(storage.size()).toBe(0);

        // Delete again — already gone
        expect(storage.delete(TOKEN)).toBe(false);
      });
    });

    test("scopes are isolated between runs", () => {
      const TOKEN_A = new InjectionToken<string>("a");

      storage.run(() => {
        storage.set(TOKEN_A, "first");
        expect(storage.get(TOKEN_A)).toBe("first");
      });

      // New scope — shouldn't see previous value
      storage.run(() => {
        expect(storage.get(TOKEN_A)).toBeUndefined();
      });
    });

    test("async scopes are isolated", async () => {
      const TOKEN_A = new InjectionToken<string>("async-a");

      await storage.runAsync(async () => {
        storage.set(TOKEN_A, "async-value");
        expect(storage.get(TOKEN_A)).toBe("async-value");
      });

      // New scope
      await storage.runAsync(async () => {
        expect(storage.get(TOKEN_A)).toBeUndefined();
      });
    });
  });
});
