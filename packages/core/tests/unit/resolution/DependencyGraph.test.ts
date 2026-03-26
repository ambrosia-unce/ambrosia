/**
 * DependencyGraph Unit Tests
 *
 * Tests async isolation via AsyncLocalStorage and sync fallback behavior.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { CircularDependencyError } from "../../../src/container/errors.ts";
import { DependencyGraph } from "../../../src/resolution/dependency-graph.ts";
import { InjectionToken } from "../../../src/types/token.ts";

const TOKEN_A = new InjectionToken("A");
const TOKEN_B = new InjectionToken("B");
const TOKEN_C = new InjectionToken("C");

describe("DependencyGraph", () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe("Sync behavior", () => {
    test("enter/exit tracks resolution chain", () => {
      graph.enter(TOKEN_A);
      graph.enter(TOKEN_B);

      expect(graph.getChain()).toEqual([TOKEN_A, TOKEN_B]);
      expect(graph.getDepth()).toBe(2);
      expect(graph.isResolving(TOKEN_A)).toBe(true);
      expect(graph.isResolving(TOKEN_B)).toBe(true);
      expect(graph.isResolving(TOKEN_C)).toBe(false);

      graph.exit(TOKEN_B);
      expect(graph.getChain()).toEqual([TOKEN_A]);
      expect(graph.getDepth()).toBe(1);

      graph.exit(TOKEN_A);
      expect(graph.getChain()).toEqual([]);
      expect(graph.getDepth()).toBe(0);
    });

    test("enter throws CircularDependencyError on duplicate token", () => {
      graph.enter(TOKEN_A);
      expect(() => graph.enter(TOKEN_A)).toThrow(CircularDependencyError);
    });

    test("enter returns true for circular when autoResolveCircular=true", () => {
      graph.enter(TOKEN_A);
      const result = graph.enter(TOKEN_A, true);
      expect(result).toBe(true);
    });

    test("clear resets the chain", () => {
      graph.enter(TOKEN_A);
      graph.enter(TOKEN_B);
      graph.clear();
      expect(graph.getChain()).toEqual([]);
      expect(graph.getDepth()).toBe(0);
    });

    test("toString formats chain", () => {
      expect(graph.toString()).toBe("<empty>");
      graph.enter(TOKEN_A);
      graph.enter(TOKEN_B);
      expect(graph.toString()).toContain("→");
    });

    test("isInAsyncContext returns false outside runAsync", () => {
      expect(graph.isInAsyncContext()).toBe(false);
    });
  });

  describe("Async behavior", () => {
    test("runAsync provides isolated context", async () => {
      await graph.runAsync(async () => {
        expect(graph.isInAsyncContext()).toBe(true);
        graph.enter(TOKEN_A);
        expect(graph.getChain()).toEqual([TOKEN_A]);
        graph.exit(TOKEN_A);
      });

      // After runAsync, sync chain should be unaffected
      expect(graph.getChain()).toEqual([]);
    });

    test("concurrent runAsync calls have isolated chains", async () => {
      const events: string[] = [];

      const task1 = graph.runAsync(async () => {
        graph.enter(TOKEN_A);
        events.push("task1-enter-A");
        // Simulate async work
        await new Promise((r) => setTimeout(r, 20));
        events.push(`task1-chain: ${graph.getDepth()}`);
        expect(graph.isResolving(TOKEN_A)).toBe(true);
        expect(graph.isResolving(TOKEN_B)).toBe(false);
        graph.exit(TOKEN_A);
      });

      const task2 = graph.runAsync(async () => {
        graph.enter(TOKEN_B);
        events.push("task2-enter-B");
        await new Promise((r) => setTimeout(r, 10));
        events.push(`task2-chain: ${graph.getDepth()}`);
        expect(graph.isResolving(TOKEN_B)).toBe(true);
        expect(graph.isResolving(TOKEN_A)).toBe(false);
        graph.exit(TOKEN_B);
      });

      await Promise.all([task1, task2]);

      // Both tasks ran without interfering
      expect(events).toContain("task1-enter-A");
      expect(events).toContain("task2-enter-B");
    });

    test("clear inside async context only clears async state", async () => {
      graph.enter(TOKEN_A);

      await graph.runAsync(async () => {
        graph.enter(TOKEN_B);
        graph.clear();
        expect(graph.getChain()).toEqual([]);
      });

      // Sync state should still have TOKEN_A
      expect(graph.getChain()).toEqual([TOKEN_A]);
      graph.exit(TOKEN_A);
    });

    test("circular detection works inside async context", async () => {
      await graph.runAsync(async () => {
        graph.enter(TOKEN_A);
        expect(() => graph.enter(TOKEN_A)).toThrow(CircularDependencyError);
        graph.exit(TOKEN_A);
      });
    });
  });
});
