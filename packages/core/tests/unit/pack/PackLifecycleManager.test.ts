import { beforeEach, describe, expect, test } from "bun:test";
import { PackLifecycleManager } from "../../../src/pack/pack-lifecycle.ts";
import type { PackDefinition } from "../../../src/pack/types.ts";

describe("PackLifecycleManager", () => {
  let manager: PackLifecycleManager;

  beforeEach(() => {
    manager = new PackLifecycleManager();
  });

  // ── register ──────────────────────────────────────────────

  test("register with onInit registers init hook", async () => {
    const called: string[] = [];
    const pack: PackDefinition = {
      onInit: () => {
        called.push("init");
      },
    };

    manager.register(pack, "test-pack");
    await manager.executeInit({});

    expect(called).toEqual(["init"]);
  });

  test("register with onDestroy registers destroy hook", async () => {
    const called: string[] = [];
    const pack: PackDefinition = {
      onDestroy: () => {
        called.push("destroy");
      },
    };

    manager.register(pack, "test-pack");
    await manager.executeDestroy();

    expect(called).toEqual(["destroy"]);
  });

  test("register with both onInit and onDestroy registers both hooks", async () => {
    const called: string[] = [];
    const pack: PackDefinition = {
      onInit: () => {
        called.push("init");
      },
      onDestroy: () => {
        called.push("destroy");
      },
    };

    manager.register(pack, "test-pack");
    await manager.executeInit({});
    await manager.executeDestroy();

    expect(called).toEqual(["init", "destroy"]);
  });

  test("register without hooks registers nothing", async () => {
    const pack: PackDefinition = {};

    manager.register(pack, "empty-pack");

    // executeInit and executeDestroy should complete without calling anything
    await manager.executeInit({});
    await manager.executeDestroy();
  });

  // ── executeInit ───────────────────────────────────────────

  test("executeInit calls onInit in registration order", async () => {
    const order: string[] = [];

    const packA: PackDefinition = {
      onInit: () => {
        order.push("A");
      },
    };
    const packB: PackDefinition = {
      onInit: () => {
        order.push("B");
      },
    };
    const packC: PackDefinition = {
      onInit: () => {
        order.push("C");
      },
    };

    manager.register(packA, "pack-a");
    manager.register(packB, "pack-b");
    manager.register(packC, "pack-c");

    await manager.executeInit({});

    expect(order).toEqual(["A", "B", "C"]);
  });

  test("executeInit passes container to onInit", async () => {
    let receivedContainer: unknown = null;
    const container = { resolve: () => {} };

    const pack: PackDefinition = {
      onInit: (c) => {
        receivedContainer = c;
      },
    };

    manager.register(pack, "test-pack");
    await manager.executeInit(container);

    expect(receivedContainer).toBe(container);
  });

  test("executeInit throws on error with pack name in message", async () => {
    const pack: PackDefinition = {
      onInit: () => {
        throw new Error("connection refused");
      },
    };

    manager.register(pack, "database-pack");

    await expect(manager.executeInit({})).rejects.toThrow(
      'Pack "database-pack" onInit failed: connection refused',
    );
  });

  test("executeInit stops on first error, subsequent hooks not called", async () => {
    const called: string[] = [];

    const packA: PackDefinition = {
      onInit: () => {
        called.push("A");
        throw new Error("fail");
      },
    };
    const packB: PackDefinition = {
      onInit: () => {
        called.push("B");
      },
    };

    manager.register(packA, "pack-a");
    manager.register(packB, "pack-b");

    await expect(manager.executeInit({})).rejects.toThrow();

    expect(called).toEqual(["A"]);
  });

  test("executeInit works with async onInit", async () => {
    let resolved = false;

    const pack: PackDefinition = {
      onInit: async () => {
        await new Promise((r) => setTimeout(r, 10));
        resolved = true;
      },
    };

    manager.register(pack, "async-pack");
    await manager.executeInit({});

    expect(resolved).toBe(true);
  });

  // ── executeDestroy ────────────────────────────────────────

  test("executeDestroy calls onDestroy in LIFO order", async () => {
    const order: string[] = [];

    const packA: PackDefinition = {
      onDestroy: () => {
        order.push("A");
      },
    };
    const packB: PackDefinition = {
      onDestroy: () => {
        order.push("B");
      },
    };
    const packC: PackDefinition = {
      onDestroy: () => {
        order.push("C");
      },
    };

    manager.register(packA, "pack-a");
    manager.register(packB, "pack-b");
    manager.register(packC, "pack-c");

    await manager.executeDestroy();

    expect(order).toEqual(["C", "B", "A"]);
  });

  test("executeDestroy continues on error and does not throw", async () => {
    const called: string[] = [];

    const packA: PackDefinition = {
      onDestroy: () => {
        called.push("A");
      },
    };
    const packB: PackDefinition = {
      onDestroy: () => {
        called.push("B");
        throw new Error("cleanup failed");
      },
    };
    const packC: PackDefinition = {
      onDestroy: () => {
        called.push("C");
      },
    };

    manager.register(packA, "pack-a");
    manager.register(packB, "pack-b");
    manager.register(packC, "pack-c");

    // Should not throw
    await manager.executeDestroy();

    // All three called in reverse order, even though B throws
    expect(called).toEqual(["C", "B", "A"]);
  });

  test("executeDestroy works with async onDestroy", async () => {
    let cleaned = false;

    const pack: PackDefinition = {
      onDestroy: async () => {
        await new Promise((r) => setTimeout(r, 10));
        cleaned = true;
      },
    };

    manager.register(pack, "async-pack");
    await manager.executeDestroy();

    expect(cleaned).toBe(true);
  });
});
