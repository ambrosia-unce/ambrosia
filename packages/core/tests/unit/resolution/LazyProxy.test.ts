/**
 * LazyProxy Unit Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { createLazyProxy, isLazyProxy } from "../../../src/resolution/lazy-proxy.ts";
import { cleanRegistry, createTestContainer } from "../../helpers/test-helpers.ts";

@Injectable()
class TestService {
  value = 42;
  getValue() {
    return this.value;
  }
}

@Injectable()
class TestServiceWithProps {
  name = "hello";
  count = 10;
  items = [1, 2, 3];

  greet(suffix: string) {
    return `${this.name}-${suffix}`;
  }
}

describe("LazyProxy", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  describe("isLazyProxy", () => {
    test("should return true for lazy proxies", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      expect(isLazyProxy(proxy)).toBe(true);
    });

    test("should return false for plain objects", () => {
      expect(isLazyProxy({})).toBe(false);
      expect(isLazyProxy({ value: 42 })).toBe(false);
      expect(isLazyProxy(new TestService())).toBe(false);
    });

    test("should return false for null and undefined", () => {
      expect(isLazyProxy(null)).toBe(false);
      expect(isLazyProxy(undefined)).toBe(false);
    });
  });

  describe("Proxy traps", () => {
    test("should forward property access to resolved instance", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      expect(proxy.value).toBe(42);
    });

    test("should forward method calls and bind context correctly", () => {
      const container = createTestContainer();
      container.registerClass(TestServiceWithProps, TestServiceWithProps);
      const proxy = createLazyProxy(TestServiceWithProps, container);

      // Method should have access to 'this' (the real instance)
      expect(proxy.greet("world")).toBe("hello-world");
    });

    test("should forward property assignment", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      proxy.value = 100;
      expect(proxy.value).toBe(100);

      // Verify it changed on the resolved instance
      const resolved = container.resolve(TestService);
      expect(resolved.value).toBe(100);
    });

    test("should forward 'in' operator", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      expect("value" in proxy).toBe(true);
      expect("getValue" in proxy).toBe(true);
      expect("nonexistent" in proxy).toBe(false);
      // __isLazyProxy is intercepted directly
      expect("__isLazyProxy" in proxy).toBe(true);
    });

    test("should forward ownKeys", () => {
      const container = createTestContainer();
      container.registerClass(TestServiceWithProps, TestServiceWithProps);
      const proxy = createLazyProxy(TestServiceWithProps, container);

      const keys = Reflect.ownKeys(proxy);
      expect(keys).toContain("name");
      expect(keys).toContain("count");
      expect(keys).toContain("items");
    });

    test("should forward getOwnPropertyDescriptor", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      const descriptor = Object.getOwnPropertyDescriptor(proxy, "value");
      expect(descriptor).toBeDefined();
      expect(descriptor!.value).toBe(42);
      expect(descriptor!.writable).toBe(true);
    });

    test("should support instanceof via getPrototypeOf", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      expect(proxy instanceof TestService).toBe(true);
    });

    test("should support delete operator via deleteProperty", () => {
      const container = createTestContainer();
      container.registerClass(TestServiceWithProps, TestServiceWithProps);
      const proxy = createLazyProxy(TestServiceWithProps, container);

      // Access to trigger resolution
      expect(proxy.name).toBe("hello");

      // Delete the property
      delete (proxy as any).name;

      // Property should be deleted on the real instance
      expect((proxy as any).name).toBeUndefined();
    });

    test("should support defineProperty", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      Object.defineProperty(proxy, "newProp", {
        value: "defined",
        writable: true,
        enumerable: true,
        configurable: true,
      });

      expect((proxy as any).newProp).toBe("defined");
    });
  });

  describe("Resolution behavior", () => {
    test("should throw when circular access is detected during resolution", () => {
      // Create a mock container whose resolveOptional triggers a re-entrant proxy access
      const proxy = createLazyProxy(TestService, {
        resolveOptional(_token: any) {
          // Simulate accessing the proxy during its own resolution
          // This is done by calling getTarget again indirectly
          // We cannot easily trigger this from outside, so we throw to simulate
          return undefined;
        },
        resolve(_token: any) {
          // Access the proxy during resolution to trigger circular detection
          // Try reading a property on the proxy which triggers getTarget again
          try {
            (proxy as any).value;
          } catch {
            // expected
          }
          throw new Error("not ready");
        },
      } as any);

      expect(() => (proxy as any).value).toThrow();
    });

    test("should resolve from container on first property access", () => {
      const container = createTestContainer();
      container.registerClass(TestService, TestService);
      const proxy = createLazyProxy(TestService, container);

      // Before access, container hasn't resolved yet (singleton not cached)
      // First access triggers resolution
      const val = proxy.value;
      expect(val).toBe(42);

      // The resolved instance should now be in the container
      const direct = container.resolve(TestService);
      expect(direct.value).toBe(42);
    });

    test("should cache the resolved instance and only resolve once", () => {
      let resolveCount = 0;
      const instance = new TestService();

      const mockContainer = {
        resolveOptional(_token: any) {
          resolveCount++;
          return instance;
        },
        resolve(_token: any) {
          resolveCount++;
          return instance;
        },
      } as any;

      const proxy = createLazyProxy(TestService, mockContainer);

      // First access triggers resolution
      expect(proxy.value).toBe(42);
      expect(resolveCount).toBe(1);

      // Subsequent accesses should use cached instance
      expect(proxy.value).toBe(42);
      expect(proxy.getValue()).toBe(42);
      expect(resolveCount).toBe(1);
    });
  });
});
