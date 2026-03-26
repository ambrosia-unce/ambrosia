/**
 * Memory profiling utilities for benchmarks
 */

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];

  /**
   * Take memory snapshot
   */
  snapshot(): MemorySnapshot {
    const mem = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    } else if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory growth between two snapshots
   */
  getGrowth(before: MemorySnapshot, after: MemorySnapshot): number {
    return after.heapUsed - before.heapUsed;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return this.snapshots;
  }

  /**
   * Clear snapshots
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Print memory report
   */
  printReport(): void {
    if (this.snapshots.length < 2) {
      console.log("Not enough snapshots for report");
      return;
    }

    console.log("\n📊 MEMORY REPORT");
    console.log("=".repeat(60));

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const growth = this.getGrowth(first, last);
    const growthPercent = (growth / first.heapUsed) * 100;

    console.log(`Initial heap: ${this.formatBytes(first.heapUsed)}`);
    console.log(`Final heap:   ${this.formatBytes(last.heapUsed)}`);
    console.log(`Growth:       ${this.formatBytes(growth)} (${growthPercent.toFixed(2)}%)`);
    console.log(
      `Peak heap:    ${this.formatBytes(Math.max(...this.snapshots.map((s) => s.heapUsed)))}`,
    );
    console.log(`Snapshots:    ${this.snapshots.length}`);
    console.log("=".repeat(60) + "\n");
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    }
  }
}
