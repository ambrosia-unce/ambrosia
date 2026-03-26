/**
 * Registry Unit Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Registry } from "../../../src";

beforeEach(() => {
  Registry.reset();
});

describe("Registry", () => {
  describe("getInstance", () => {
    test("should return the same singleton instance", () => {
      const a = Registry.getInstance();
      const b = Registry.getInstance();
      expect(a).toBe(b);
    });
  });

  describe("registerProvider / getProvider", () => {
    test("should store a provider and retrieve it by token", () => {
      const registry = Registry.getInstance();

      class MyService {}
      const provider = { token: MyService, useClass: MyService };

      registry.registerProvider(provider);

      expect(registry.getProvider(MyService)).toBe(provider);
    });

    test("should warn on duplicate registration but not throw", () => {
      const registry = Registry.getInstance();

      class MyService {}
      const provider1 = { token: MyService, useClass: MyService };
      const provider2 = { token: MyService, useClass: MyService };

      registry.registerProvider(provider1);
      // Should not throw on duplicate
      expect(() => registry.registerProvider(provider2)).not.toThrow();
      // The second registration overwrites the first
      expect(registry.getProvider(MyService)).toBe(provider2);
    });
  });

  describe("registerProviderSilent", () => {
    test("should overwrite a provider silently without warning", () => {
      const registry = Registry.getInstance();

      class MyService {}
      const provider1 = { token: MyService, useClass: MyService };
      const provider2 = { token: MyService, useClass: MyService };

      registry.registerProviderSilent(provider1);
      registry.registerProviderSilent(provider2);

      expect(registry.getProvider(MyService)).toBe(provider2);
    });
  });

  describe("hasProvider", () => {
    test("should return true for registered token and false for unregistered", () => {
      const registry = Registry.getInstance();

      class Registered {}
      class NotRegistered {}

      registry.registerProvider({ token: Registered, useClass: Registered });

      expect(registry.hasProvider(Registered)).toBe(true);
      expect(registry.hasProvider(NotRegistered)).toBe(false);
    });
  });

  describe("getAllProviders", () => {
    test("should return all registered providers", () => {
      const registry = Registry.getInstance();

      class ServiceA {}
      class ServiceB {}

      const providerA = { token: ServiceA, useClass: ServiceA };
      const providerB = { token: ServiceB, useClass: ServiceB };

      registry.registerProvider(providerA);
      registry.registerProvider(providerB);

      const all = registry.getAllProviders();
      expect(all).toHaveLength(2);
      expect(all).toContain(providerA);
      expect(all).toContain(providerB);
    });
  });

  describe("getAllTokens", () => {
    test("should return all registered tokens", () => {
      const registry = Registry.getInstance();

      class ServiceA {}
      class ServiceB {}

      registry.registerProvider({ token: ServiceA, useClass: ServiceA });
      registry.registerProvider({ token: ServiceB, useClass: ServiceB });

      const tokens = registry.getAllTokens();
      expect(tokens).toHaveLength(2);
      expect(tokens).toContain(ServiceA);
      expect(tokens).toContain(ServiceB);
    });
  });

  describe("registerImplementation / getProvider with abstract", () => {
    test("should resolve abstract token to concrete provider via implementations map", () => {
      const registry = Registry.getInstance();

      abstract class AbstractService {
        abstract doWork(): void;
      }

      class ConcreteService extends AbstractService {
        doWork() {}
      }

      const provider = { token: ConcreteService, useClass: ConcreteService };
      registry.registerProvider(provider);
      registry.registerImplementation(AbstractService, ConcreteService);

      // getProvider with abstract token should find the concrete provider
      expect(registry.getProvider(AbstractService)).toBe(provider);
      // hasProvider should also return true for abstract token
      expect(registry.hasProvider(AbstractService)).toBe(true);
    });
  });

  describe("getImplementation", () => {
    test("should return the concrete class for an abstract token", () => {
      const registry = Registry.getInstance();

      abstract class AbstractRepo {}
      class ConcreteRepo extends AbstractRepo {}

      registry.registerImplementation(AbstractRepo, ConcreteRepo);

      expect(registry.getImplementation(AbstractRepo)).toBe(ConcreteRepo);
      expect(registry.getImplementation(class Unknown {})).toBeUndefined();
    });
  });

  describe("removeProvider", () => {
    test("should remove a provider and return true, or false if not found", () => {
      const registry = Registry.getInstance();

      class MyService {}
      registry.registerProvider({ token: MyService, useClass: MyService });

      expect(registry.removeProvider(MyService)).toBe(true);
      expect(registry.getProvider(MyService)).toBeUndefined();
      expect(registry.removeProvider(MyService)).toBe(false);
    });
  });

  describe("clear", () => {
    test("should empty both providers and implementations maps", () => {
      const registry = Registry.getInstance();

      abstract class AbstractService {}
      class ConcreteService extends AbstractService {}

      registry.registerProvider({ token: ConcreteService, useClass: ConcreteService });
      registry.registerImplementation(AbstractService, ConcreteService);

      expect(registry.size).toBeGreaterThan(0);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getProvider(ConcreteService)).toBeUndefined();
      expect(registry.getImplementation(AbstractService)).toBeUndefined();
    });
  });

  describe("autoRegisterTo", () => {
    test("should call registerFn for each registered provider", () => {
      const registry = Registry.getInstance();

      class ServiceA {}
      class ServiceB {}

      const providerA = { token: ServiceA, useClass: ServiceA };
      const providerB = { token: ServiceB, useClass: ServiceB };

      registry.registerProvider(providerA);
      registry.registerProvider(providerB);

      const collected: any[] = [];
      registry.autoRegisterTo((provider) => {
        collected.push(provider);
      });

      expect(collected).toHaveLength(2);
      expect(collected).toContain(providerA);
      expect(collected).toContain(providerB);
    });
  });

  describe("size", () => {
    test("should return the correct number of registered providers", () => {
      const registry = Registry.getInstance();

      expect(registry.size).toBe(0);

      class A {}
      class B {}
      class C {}

      registry.registerProvider({ token: A, useClass: A });
      expect(registry.size).toBe(1);

      registry.registerProvider({ token: B, useClass: B });
      registry.registerProvider({ token: C, useClass: C });
      expect(registry.size).toBe(3);

      registry.removeProvider(A);
      expect(registry.size).toBe(2);
    });
  });

  describe("reset", () => {
    test("should clear the registry and create a new instance on next access", () => {
      const before = Registry.getInstance();
      class MyService {}
      before.registerProvider({ token: MyService, useClass: MyService });

      Registry.reset();

      const after = Registry.getInstance();
      // New instance after reset
      expect(after).not.toBe(before);
      // New instance should be empty
      expect(after.size).toBe(0);
      expect(after.getProvider(MyService)).toBeUndefined();
    });
  });
});
