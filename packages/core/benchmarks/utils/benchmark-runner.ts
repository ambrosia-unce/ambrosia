/**
 * Enhanced benchmark runner with warmup and statistics
 */

export interface BenchmarkOptions {
  warmup?: number; // Warmup iterations (default: 100)
  iterations?: number; // Benchmark iterations (default: 1000)
  name: string;
  fn: () => void | Promise<void>;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTime: number; // microseconds
  minTime: number;
  maxTime: number;
  stdDev: number;
  memoryUsed?: number; // bytes
  timestamp: number;
}

/**
 * Enhanced benchmark runner with warmup and detailed stats
 */
export class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  /**
   * Run benchmark with warmup and detailed stats
   */
  async run(options: BenchmarkOptions): Promise<BenchmarkResult> {
    const { warmup = 100, iterations = 1000, name, fn, setup, teardown } = options;

    // Setup
    if (setup) await setup();

    // Warmup phase
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Force GC before measurement
    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    }

    // Measurement phase
    const times: number[] = [];
    const memStart = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push((end - start) * 1000); // Convert to microseconds
    }

    const memEnd = process.memoryUsage().heapUsed;

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const variance = times.reduce((sum, t) => sum + (t - avgTime) ** 2, 0) / times.length;
    const stdDev = Math.sqrt(variance);
    const opsPerSec = 1_000_000 / avgTime;

    const result: BenchmarkResult = {
      name,
      opsPerSec,
      avgTime,
      minTime,
      maxTime,
      stdDev,
      memoryUsed: memEnd - memStart,
      timestamp: Date.now(),
    };

    this.results.push(result);

    // Teardown
    if (teardown) await teardown();

    return result;
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = [];
  }
}
