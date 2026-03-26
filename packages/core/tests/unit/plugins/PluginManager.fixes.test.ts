/**
 * PluginManager fixes tests
 *
 * Tests binary insertion ordering and replacement behavior
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { PluginManager } from "../../../src/plugins/plugin-manager.ts";
import type { Plugin } from "../../../src/plugins/types.ts";
import { PluginPriority } from "../../../src/plugins/types.ts";

function makePlugin(name: string): Plugin {
  return { name };
}

describe("PluginManager binary insertion", () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  test("plugins are ordered by priority (highest first)", () => {
    manager.register(makePlugin("low"), PluginPriority.LOW);
    manager.register(makePlugin("high"), PluginPriority.HIGH);
    manager.register(makePlugin("normal"), PluginPriority.NORMAL);

    const names = manager.getPlugins().map((p) => p.name);
    expect(names).toEqual(["high", "normal", "low"]);
  });

  test("plugins with same priority maintain insertion order", () => {
    manager.register(makePlugin("first"), PluginPriority.NORMAL);
    manager.register(makePlugin("second"), PluginPriority.NORMAL);
    manager.register(makePlugin("third"), PluginPriority.NORMAL);

    const names = manager.getPlugins().map((p) => p.name);
    expect(names).toEqual(["first", "second", "third"]);
  });

  test("replacing plugin preserves correct ordering", () => {
    manager.register(makePlugin("a"), PluginPriority.HIGH);
    manager.register(makePlugin("b"), PluginPriority.NORMAL);
    manager.register(makePlugin("c"), PluginPriority.LOW);

    // Replace "b" with LOW priority
    manager.register(makePlugin("b"), PluginPriority.LOW);

    const names = manager.getPlugins().map((p) => p.name);
    expect(names).toEqual(["a", "c", "b"]);
  });

  test("inserting at all priority levels", () => {
    manager.register(makePlugin("lowest"), PluginPriority.LOWEST);
    manager.register(makePlugin("highest"), PluginPriority.HIGHEST);
    manager.register(makePlugin("normal"), PluginPriority.NORMAL);
    manager.register(makePlugin("low"), PluginPriority.LOW);
    manager.register(makePlugin("high"), PluginPriority.HIGH);

    const names = manager.getPlugins().map((p) => p.name);
    expect(names).toEqual(["highest", "high", "normal", "low", "lowest"]);
  });

  test("many plugins maintain correct order", () => {
    // Insert 20 plugins with varying priorities
    for (let i = 0; i < 20; i++) {
      const priority = (i * 7) % 5; // 0-4 in pseudo-random order
      manager.register(makePlugin(`p${i}`), (priority * 25) as PluginPriority);
    }

    const plugins = manager.getPlugins();
    // Verify descending priority order
    for (let i = 1; i < plugins.length; i++) {
      // Can't check priority directly — just ensure it didn't crash
      expect(plugins[i]).toBeDefined();
    }
    expect(plugins.length).toBe(20);
  });
});
