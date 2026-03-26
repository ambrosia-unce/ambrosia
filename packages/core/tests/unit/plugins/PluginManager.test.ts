import { beforeEach, describe, expect, test } from "bun:test";
import { PluginManager } from "../../../src/plugins/plugin-manager.ts";
import type { Plugin, ResolutionContext } from "../../../src/plugins/types.ts";
import { PluginPriority } from "../../../src/plugins/types.ts";
import { Scope } from "../../../src/scope/types.ts";
import type { Provider } from "../../../src/types";

function createMockPlugin(name: string, hooks?: Partial<Plugin>): Plugin {
  return { name, version: "1.0.0", ...hooks };
}

function createMockContext(overrides?: Partial<ResolutionContext>): ResolutionContext {
  return {
    token: "TestToken",
    scope: Scope.SINGLETON,
    depth: 0,
    startTime: Date.now(),
    optional: false,
    ...overrides,
  };
}

describe("PluginManager", () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  test("register adds a plugin", () => {
    const plugin = createMockPlugin("test-plugin");
    manager.register(plugin);

    expect(manager.size).toBe(1);
    expect(manager.hasPlugin("test-plugin")).toBe(true);
  });

  test("register replaces plugin with same name", () => {
    const plugin1 = createMockPlugin("test-plugin", { version: "1.0.0" });
    const plugin2 = createMockPlugin("test-plugin", { version: "2.0.0" });

    manager.register(plugin1);
    manager.register(plugin2);

    expect(manager.size).toBe(1);
    const plugins = manager.getPlugins();
    expect(plugins[0].version).toBe("2.0.0");
  });

  test("unregister removes plugin and returns true", () => {
    const plugin = createMockPlugin("test-plugin");
    manager.register(plugin);

    const result = manager.unregister("test-plugin");

    expect(result).toBe(true);
    expect(manager.size).toBe(0);
    expect(manager.hasPlugin("test-plugin")).toBe(false);
  });

  test("unregister returns false for non-existent plugin", () => {
    const result = manager.unregister("non-existent");
    expect(result).toBe(false);
  });

  test("getPlugins returns all registered plugins", () => {
    const plugin1 = createMockPlugin("plugin-a");
    const plugin2 = createMockPlugin("plugin-b");
    const plugin3 = createMockPlugin("plugin-c");

    manager.register(plugin1);
    manager.register(plugin2);
    manager.register(plugin3);

    const plugins = manager.getPlugins();
    expect(plugins).toHaveLength(3);
    expect(plugins.map((p) => p.name)).toContain("plugin-a");
    expect(plugins.map((p) => p.name)).toContain("plugin-b");
    expect(plugins.map((p) => p.name)).toContain("plugin-c");
  });

  test("hasPlugin returns true for registered and false for unregistered", () => {
    manager.register(createMockPlugin("exists"));

    expect(manager.hasPlugin("exists")).toBe(true);
    expect(manager.hasPlugin("does-not-exist")).toBe(false);
  });

  test("plugins are sorted by priority (highest first)", () => {
    const low = createMockPlugin("low-priority");
    const high = createMockPlugin("high-priority");
    const normal = createMockPlugin("normal-priority");

    manager.register(low, PluginPriority.LOW);
    manager.register(high, PluginPriority.HIGH);
    manager.register(normal, PluginPriority.NORMAL);

    const plugins = manager.getPlugins();
    expect(plugins[0].name).toBe("high-priority");
    expect(plugins[1].name).toBe("normal-priority");
    expect(plugins[2].name).toBe("low-priority");
  });

  test("executeOnContainerCreate calls all plugins", () => {
    const calls: string[] = [];
    const mockContainer = {} as any;

    manager.register(
      createMockPlugin("plugin-a", {
        onContainerCreate: () => calls.push("a"),
      }),
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onContainerCreate: () => calls.push("b"),
      }),
    );

    manager.executeOnContainerCreate(mockContainer);

    expect(calls).toEqual(["a", "b"]);
  });

  test("executeOnBeforeResolve calls all plugins", () => {
    const calls: string[] = [];
    const context = createMockContext();

    manager.register(
      createMockPlugin("plugin-a", {
        onBeforeResolve: () => calls.push("a"),
      }),
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onBeforeResolve: () => calls.push("b"),
      }),
    );

    manager.executeOnBeforeResolve("SomeToken", context);

    expect(calls).toEqual(["a", "b"]);
  });

  test("executeOnAfterResolve calls all plugins", () => {
    const calls: string[] = [];
    const context = createMockContext();
    const instance = { value: 42 };

    manager.register(
      createMockPlugin("plugin-a", {
        onAfterResolve: () => calls.push("a"),
      }),
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onAfterResolve: () => calls.push("b"),
      }),
    );

    manager.executeOnAfterResolve("SomeToken", instance, context);

    expect(calls).toEqual(["a", "b"]);
  });

  test("executeOnError calls all plugins", () => {
    const calls: string[] = [];
    const context = createMockContext();
    const error = new Error("test error");

    manager.register(
      createMockPlugin("plugin-a", {
        onError: () => calls.push("a"),
      }),
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onError: () => calls.push("b"),
      }),
    );

    manager.executeOnError(error, context);

    expect(calls).toEqual(["a", "b"]);
  });

  test("executeOnRegisterProvider transforms provider through chain", () => {
    const baseProvider = {
      provide: "TestToken",
      useValue: "original",
    } as unknown as Provider;

    manager.register(
      createMockPlugin("plugin-a", {
        onRegisterProvider: (provider: Provider) =>
          ({
            ...provider,
            _transformedByA: true,
          }) as unknown as Provider,
      }),
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onRegisterProvider: (provider: Provider) =>
          ({
            ...provider,
            _transformedByB: true,
          }) as unknown as Provider,
      }),
    );

    const result = manager.executeOnRegisterProvider(baseProvider) as any;

    expect(result._transformedByA).toBe(true);
    expect(result._transformedByB).toBe(true);
    expect(result.provide).toBe("TestToken");
  });

  test("plugin errors are isolated and do not stop other plugins", () => {
    const calls: string[] = [];
    const mockContainer = {} as any;

    manager.register(
      createMockPlugin("plugin-a", {
        onContainerCreate: () => calls.push("a"),
      }),
      PluginPriority.HIGH,
    );
    manager.register(
      createMockPlugin("plugin-throwing", {
        onContainerCreate: () => {
          throw new Error("plugin crashed");
        },
      }),
      PluginPriority.NORMAL,
    );
    manager.register(
      createMockPlugin("plugin-b", {
        onContainerCreate: () => calls.push("b"),
      }),
      PluginPriority.LOW,
    );

    manager.executeOnContainerCreate(mockContainer);

    expect(calls).toEqual(["a", "b"]);
  });

  test("clear removes all plugins and size returns 0", () => {
    manager.register(createMockPlugin("plugin-a"));
    manager.register(createMockPlugin("plugin-b"));
    manager.register(createMockPlugin("plugin-c"));

    expect(manager.size).toBe(3);

    manager.clear();

    expect(manager.size).toBe(0);
    expect(manager.getPlugins()).toEqual([]);
    expect(manager.hasPlugin("plugin-a")).toBe(false);
  });
});
