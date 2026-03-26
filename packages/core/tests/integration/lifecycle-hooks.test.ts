/**
 * Lifecycle Hooks Integration Tests
 *
 * Tests OnInit/OnDestroy lifecycle hooks through real Container resolution.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../src/container/container.ts";
import { Injectable } from "../../src/decorators/injectable.ts";
import type { OnDestroy, OnInit } from "../../src/interfaces/lifecycle.ts";
import { cleanRegistry, createTestContainer } from "../helpers/test-helpers.ts";

describe("Lifecycle Hooks Integration", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  describe("OnInit", () => {
    test("sync onInit is called on resolve", () => {
      let initCalled = false;

      @Injectable()
      class ServiceA implements OnInit {
        onInit(): void {
          initCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(ServiceA, ServiceA);
      container.resolve(ServiceA);

      expect(initCalled).toBe(true);
    });

    test("sync onInit is called only once for singleton", () => {
      let initCount = 0;

      @Injectable()
      class SingletonService implements OnInit {
        onInit(): void {
          initCount++;
        }
      }

      const container = createTestContainer();
      container.registerClass(SingletonService, SingletonService);

      container.resolve(SingletonService);
      container.resolve(SingletonService);
      container.resolve(SingletonService);

      expect(initCount).toBe(1);
    });

    test("async onInit throws on sync resolve with helpful message", () => {
      @Injectable()
      class AsyncService implements OnInit {
        async onInit(): Promise<void> {
          await new Promise((r) => setTimeout(r, 1));
        }
      }

      const container = createTestContainer();
      container.registerClass(AsyncService, AsyncService);

      expect(() => container.resolve(AsyncService)).toThrow(
        "AsyncService.onInit() returned a Promise. Use container.resolveAsync() for async lifecycle hooks.",
      );
    });

    test("async onInit works with resolveAsync", async () => {
      let initCalled = false;

      @Injectable()
      class AsyncService implements OnInit {
        async onInit(): Promise<void> {
          await new Promise((r) => setTimeout(r, 1));
          initCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(AsyncService, AsyncService);

      await container.resolveAsync(AsyncService);

      expect(initCalled).toBe(true);
    });

    test("onInit receives fully injected instance with dependencies available", () => {
      let depAvailableInInit = false;

      @Injectable()
      class Dependency {
        value = 42;
      }

      @Injectable()
      class ServiceWithDep implements OnInit {
        constructor(public dep: Dependency) {}

        onInit(): void {
          depAvailableInInit = this.dep != null && this.dep.value === 42;
        }
      }

      const container = createTestContainer();
      container.registerClass(Dependency, Dependency);
      container.registerClass(ServiceWithDep, ServiceWithDep);

      const instance = container.resolve(ServiceWithDep);

      expect(depAvailableInInit).toBe(true);
      expect(instance.dep).toBeInstanceOf(Dependency);
    });
  });

  describe("OnDestroy", () => {
    test("onDestroy is called on destroyAll", async () => {
      let destroyCalled = false;

      @Injectable()
      class DestroyableService implements OnDestroy {
        onDestroy(): void {
          destroyCalled = true;
        }
      }

      const container = createTestContainer();
      container.registerClass(DestroyableService, DestroyableService);
      container.resolve(DestroyableService);

      await container.destroyAll();

      expect(destroyCalled).toBe(true);
    });

    test("onDestroy is called in LIFO order", async () => {
      const destroyOrder: string[] = [];

      @Injectable()
      class FirstService implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("first");
        }
      }

      @Injectable()
      class SecondService implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("second");
        }
      }

      const container = createTestContainer();
      container.registerClass(FirstService, FirstService);
      container.registerClass(SecondService, SecondService);

      container.resolve(FirstService);
      container.resolve(SecondService);

      await container.destroyAll();

      expect(destroyOrder).toEqual(["second", "first"]);
    });

    test("multiple services: onDestroy order is reverse of creation order", async () => {
      const destroyOrder: string[] = [];

      @Injectable()
      class Alpha implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("alpha");
        }
      }

      @Injectable()
      class Beta implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("beta");
        }
      }

      @Injectable()
      class Gamma implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("gamma");
        }
      }

      const container = createTestContainer();
      container.registerClass(Alpha, Alpha);
      container.registerClass(Beta, Beta);
      container.registerClass(Gamma, Gamma);

      container.resolve(Alpha);
      container.resolve(Beta);
      container.resolve(Gamma);

      await container.destroyAll();

      expect(destroyOrder).toEqual(["gamma", "beta", "alpha"]);
    });

    test("destroyAll returns empty array when no errors", async () => {
      @Injectable()
      class CleanService implements OnDestroy {
        onDestroy(): void {
          // no-op
        }
      }

      const container = createTestContainer();
      container.registerClass(CleanService, CleanService);
      container.resolve(CleanService);

      const errors = await container.destroyAll();

      expect(errors).toEqual([]);
    });

    test("destroyAll returns errors from failed onDestroy hooks", async () => {
      @Injectable()
      class FailingService implements OnDestroy {
        onDestroy(): void {
          throw new Error("destroy failed");
        }
      }

      const container = createTestContainer();
      container.registerClass(FailingService, FailingService);
      container.resolve(FailingService);

      const errors = await container.destroyAll();

      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toBe("destroy failed");
    });

    test("destroyAll continues even when one onDestroy throws", async () => {
      const destroyOrder: string[] = [];

      @Injectable()
      class FirstOk implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("first");
        }
      }

      @Injectable()
      class Failing implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("failing");
          throw new Error("boom");
        }
      }

      @Injectable()
      class LastOk implements OnDestroy {
        onDestroy(): void {
          destroyOrder.push("last");
        }
      }

      const container = createTestContainer();
      container.registerClass(FirstOk, FirstOk);
      container.registerClass(Failing, Failing);
      container.registerClass(LastOk, LastOk);

      container.resolve(FirstOk);
      container.resolve(Failing);
      container.resolve(LastOk);

      const errors = await container.destroyAll();

      // LIFO: last -> failing -> first
      expect(destroyOrder).toEqual(["last", "failing", "first"]);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toBe("boom");
    });
  });
});
