/**
 * Benchmark reporters for console, JSON, and CSV output
 */

import type { BenchmarkResult } from "./benchmark-runner.ts";

export interface ReporterOptions {
  showMemory?: boolean;
  showStats?: boolean;
  colorize?: boolean;
}

/**
 * Console reporter with colors and formatting
 */
export class ConsoleReporter {
  constructor(private options: ReporterOptions = {}) {}

  report(results: BenchmarkResult[]): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 BENCHMARK RESULTS");
    console.log("=".repeat(80) + "\n");

    // Group by category (based on name prefix)
    const grouped = this.groupResults(results);

    for (const [category, categoryResults] of Object.entries(grouped)) {
      console.log(`\n📁 ${category}`);
      console.log("-".repeat(80));

      for (const result of categoryResults) {
        this.printResult(result);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📈 SUMMARY");
    console.log("=".repeat(80));

    const fastest = results.reduce((a, b) => (a.opsPerSec > b.opsPerSec ? a : b));
    const slowest = results.reduce((a, b) => (a.opsPerSec < b.opsPerSec ? a : b));
    const totalOps = results.reduce((sum, r) => sum + r.opsPerSec, 0);
    const avgOps = totalOps / results.length;

    console.log(`Fastest: ${fastest.name} (${this.formatOps(fastest.opsPerSec)})`);
    console.log(`Slowest: ${slowest.name} (${this.formatOps(slowest.opsPerSec)})`);
    console.log(`Average: ${this.formatOps(avgOps)}`);
    console.log(`Total benchmarks: ${results.length}`);
    console.log("");
  }

  private printResult(result: BenchmarkResult): void {
    const opsStr = this.formatOps(result.opsPerSec);
    const timeStr = this.formatTime(result.avgTime);

    console.log(`  ✓ ${result.name}`);
    console.log(`    ${opsStr} | ${timeStr}`);

    if (this.options.showStats) {
      console.log(
        `    min: ${this.formatTime(result.minTime)} | max: ${this.formatTime(result.maxTime)} | stdDev: ${result.stdDev.toFixed(2)}μs`,
      );
    }

    if (this.options.showMemory && result.memoryUsed !== undefined) {
      console.log(`    memory: ${this.formatMemory(result.memoryUsed)}`);
    }
  }

  private formatOps(opsPerSec: number): string {
    if (opsPerSec >= 1_000_000) {
      return `${(opsPerSec / 1_000_000).toFixed(2)}M ops/sec`;
    } else if (opsPerSec >= 1_000) {
      return `${(opsPerSec / 1_000).toFixed(2)}K ops/sec`;
    }
    return `${opsPerSec.toFixed(2)} ops/sec`;
  }

  private formatTime(microseconds: number): string {
    if (microseconds < 1) {
      return `${(microseconds * 1000).toFixed(2)}ns`;
    } else if (microseconds < 1000) {
      return `${microseconds.toFixed(2)}μs`;
    } else if (microseconds < 1_000_000) {
      return `${(microseconds / 1000).toFixed(2)}ms`;
    }
    return `${(microseconds / 1_000_000).toFixed(2)}s`;
  }

  private formatMemory(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    }
  }

  private groupResults(results: BenchmarkResult[]): Record<string, BenchmarkResult[]> {
    const grouped: Record<string, BenchmarkResult[]> = {};

    for (const result of results) {
      const category = result.name.split(":")[0] || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    }

    return grouped;
  }
}

/**
 * JSON reporter for CI/CD and comparison
 */
export class JSONReporter {
  async report(results: BenchmarkResult[], outputPath: string): Promise<void> {
    const output = {
      timestamp: Date.now(),
      runtime: {
        bun: Bun.version,
        platform: process.platform,
        arch: process.arch,
      },
      results,
    };

    await Bun.write(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ JSON report saved to: ${outputPath}`);
  }
}

/**
 * CSV reporter for spreadsheet analysis
 */
export class CSVReporter {
  async report(results: BenchmarkResult[], outputPath: string): Promise<void> {
    const headers = [
      "name",
      "ops_per_sec",
      "avg_time_us",
      "min_time_us",
      "max_time_us",
      "std_dev_us",
      "memory_bytes",
    ];
    const rows = results.map((r) => [
      r.name,
      r.opsPerSec.toFixed(2),
      r.avgTime.toFixed(2),
      r.minTime.toFixed(2),
      r.maxTime.toFixed(2),
      r.stdDev.toFixed(2),
      r.memoryUsed?.toString() || "0",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    await Bun.write(outputPath, csv);
    console.log(`✅ CSV report saved to: ${outputPath}`);
  }
}
