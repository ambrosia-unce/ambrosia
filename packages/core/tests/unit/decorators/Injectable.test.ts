/**
 * @Injectable Decorator Unit Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { Container } from "../../../src/container/container.ts";
import { Registry } from "../../../src/container/registry.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { MetadataManager } from "../../../src/metadata/metadata-manager.ts";
import { Scope } from "../../../src/scope/types.ts";
import { cleanRegistry } from "../../helpers/test-helpers.ts";

describe("@Injectable", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  test("should mark class as injectable", () => {
    @Injectable()
    class TestService {}

    const metadata = MetadataManager.getInjectable(TestService);
    expect(metadata).toBeDefined();
    expect(metadata?.token).toBe(TestService);
  });

  test("should default to SINGLETON scope", () => {
    @Injectable()
    class TestService {}

    const metadata = MetadataManager.getInjectable(TestService);
    expect(metadata?.scope).toBe(Scope.SINGLETON);
  });

  test("should accept custom scope", () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class TestService {}

    const metadata = MetadataManager.getInjectable(TestService);
    expect(metadata?.scope).toBe(Scope.TRANSIENT);
  });

  test("should auto-register in global Registry", () => {
    @Injectable()
    class TestService {}

    const registry = Registry.getInstance();
    const provider = registry.getProvider(TestService);

    expect(provider).toBeDefined();
    expect(provider?.token).toBe(TestService);
  });

  test("should be resolvable from container", () => {
    @Injectable()
    class TestService {
      value = 42;
    }

    const container = new Container(true);
    const instance = container.resolve<TestService>(TestService);

    expect(instance).toBeInstanceOf(TestService);
    expect(instance.value).toBe(42);
  });

  test("should work with constructor dependencies", () => {
    @Injectable()
    class Database {
      connected = false;
    }

    @Injectable()
    class UserService {
      constructor(public db: Database) {}
    }

    const container = new Container(true);
    const service = container.resolve<UserService>(UserService);

    expect(service).toBeInstanceOf(UserService);
    expect(service.db).toBeInstanceOf(Database);
  });

  test("should respect SINGLETON scope (same instance)", () => {
    @Injectable({ scope: Scope.SINGLETON })
    class SingletonService {
      id = Math.random();
    }

    const container = new Container(true);
    const instance1 = container.resolve<SingletonService>(SingletonService);
    const instance2 = container.resolve<SingletonService>(SingletonService);

    expect(instance1).toBe(instance2);
    expect(instance1.id).toBe(instance2.id);
  });

  test("should respect TRANSIENT scope (different instances)", () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class TransientService {
      id = Math.random();
    }

    const container = new Container(true);
    const instance1 = container.resolve<TransientService>(TransientService);
    const instance2 = container.resolve<TransientService>(TransientService);

    expect(instance1).not.toBe(instance2);
    expect(instance1.id).not.toBe(instance2.id);
  });

  test("should work with REQUEST scope", () => {
    @Injectable({ scope: Scope.REQUEST })
    class RequestService {
      requestId = "";
    }

    const container = new Container(true);

    container.requestStorage.run(() => {
      const instance1 = container.resolve<RequestService>(RequestService);
      const instance2 = container.resolve<RequestService>(RequestService);

      // Same instance within request scope
      expect(instance1).toBe(instance2);
    });
  });

  test("should work on multiple classes", () => {
    @Injectable()
    class ServiceA {}

    @Injectable()
    class ServiceB {}

    @Injectable()
    class ServiceC {}

    const container = new Container(true);

    expect(container.has(ServiceA)).toBe(true);
    expect(container.has(ServiceB)).toBe(true);
    expect(container.has(ServiceC)).toBe(true);
  });
});
