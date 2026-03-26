/**
 * Circular Dependency Detection Integration Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { CircularDependencyError } from "../../src/container/errors.ts";
import { container, Inject, Injectable, InjectionToken } from "../../src/index.ts";
import { cleanRegistry } from "../helpers/test-helpers.ts";

describe("Circular Dependencies", () => {
  beforeEach(() => {
    cleanRegistry();
    container.clearAll();
  });

  test("should detect simple circular dependency", () => {
    // Use tokens to avoid forward reference issues
    const A_TOKEN = new InjectionToken("ServiceA");
    const B_TOKEN = new InjectionToken("ServiceB");

    class ServiceA {
      constructor(@Inject(B_TOKEN) public _b: any) {}
    }

    class ServiceB {
      constructor(@Inject(A_TOKEN) public _a: any) {}
    }

    Injectable()(ServiceA);
    Injectable()(ServiceB);

    container.registerClass(A_TOKEN, ServiceA);
    container.registerClass(B_TOKEN, ServiceB);

    expect(() => container.resolve<any>(A_TOKEN)).toThrow(CircularDependencyError);
  });

  test("should provide helpful error message", () => {
    const A_TOKEN = new InjectionToken("ServiceA");
    const B_TOKEN = new InjectionToken("ServiceB");

    class ServiceA {
      constructor(@Inject(B_TOKEN) public _b: any) {}
    }

    class ServiceB {
      constructor(@Inject(A_TOKEN) public _a: any) {}
    }

    Injectable()(ServiceA);
    Injectable()(ServiceB);

    container.registerClass(A_TOKEN, ServiceA);
    container.registerClass(B_TOKEN, ServiceB);

    try {
      container.resolve<any>(A_TOKEN);
      throw new Error("Should have thrown CircularDependencyError");
    } catch (error) {
      expect(error).toBeInstanceOf(CircularDependencyError);
      expect((error as Error).message).toContain("Circular dependency detected");
    }
  });

  test("should not falsely detect cycles in diamond dependencies", () => {
    // Diamond pattern: D depends on B and C, both depend on A
    @Injectable()
    class A {
      id = "A";
    }

    @Injectable()
    class B {
      constructor(public a: A) {}
    }

    @Injectable()
    class C {
      constructor(public a: A) {}
    }

    @Injectable()
    class D {
      constructor(
        public b: B,
        public c: C,
      ) {}
    }

    // Should NOT throw - this is not a cycle, just shared dependency
    const d = container.resolve<D>(D);

    expect(d).toBeInstanceOf(D);
    expect(d.b).toBeInstanceOf(B);
    expect(d.c).toBeInstanceOf(C);
    expect(d.b.a).toBe(d.c.a); // Same singleton A instance
    expect(d.b.a.id).toBe("A");
  });

  test("should allow deep dependency chains without false positives", () => {
    @Injectable()
    class Level1 {
      value = 1;
    }

    @Injectable()
    class Level2 {
      constructor(public l1: Level1) {}
    }

    @Injectable()
    class Level3 {
      constructor(public l2: Level2) {}
    }

    @Injectable()
    class Level4 {
      constructor(public l3: Level3) {}
    }

    @Injectable()
    class Level5 {
      constructor(public l4: Level4) {}
    }

    const l5 = container.resolve<Level5>(Level5);

    expect(l5.l4.l3.l2.l1.value).toBe(1);
  });
});
