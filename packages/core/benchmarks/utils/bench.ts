/**
 * Benchmark wrapper for bun:test
 * Provides bench() function similar to vitest/benchmark
 */

import { describe as bunDescribe, test } from "bun:test";

export { describe } from "bun:test";

export interface BenchOptions {
  iterations?: number;
  warmup?: number;
}

/**
 * Run a benchmark
 */
export function bench(name: string, fn: () => void | Promise<void>, options: BenchOptions = {}) {
  const iterations = options.iterations ?? 1000;
  const warmup = options.warmup ?? 100;

  test(name, async () => {
    // Warmup
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Force GC
    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    }

    // Measure
    const times: number[] = [];
    const memStart = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const memEnd = process.memoryUsage().heapUsed;

    // Calculate stats
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSec = 1000 / avgTime;
    const memUsed = memEnd - memStart;

    // Print results
    console.log(`\n  ✓ ${name}`);
    console.log(`    ${formatOps(opsPerSec)} | avg: ${formatTime(avgTime)}`);
    console.log(`    min: ${formatTime(minTime)} | max: ${formatTime(maxTime)}`);
    if (memUsed > 0) {
      console.log(`    memory: ${formatMemory(memUsed)}`);
    }
  });
}

function formatOps(opsPerSec: number): string {
  if (opsPerSec >= 1_000_000) {
    return `${(opsPerSec / 1_000_000).toFixed(2)}M ops/sec`;
  } else if (opsPerSec >= 1_000) {
    return `${(opsPerSec / 1_000).toFixed(2)}K ops/sec`;
  }
  return `${opsPerSec.toFixed(0)} ops/sec`;
}

function formatTime(ms: number): string {
  if (ms < 0.001) {
    return `${(ms * 1_000_000).toFixed(2)}ns`;
  } else if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatMemory(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }
}
