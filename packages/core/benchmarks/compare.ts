/**
 * Compare benchmark results from different runs
 * Usage: bun run benchmarks/compare.ts baseline.json current.json
 */

interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTime: number;
}

interface BenchmarkReport {
  timestamp: number;
  runtime: {
    bun: string;
    platform: string;
    arch: string;
  };
  results: BenchmarkResult[];
}

async function compare(baselinePath: string, currentPath: string) {
  const baseline: BenchmarkReport = await Bun.file(baselinePath).json();
  const current: BenchmarkReport = await Bun.file(currentPath).json();

  console.log("\n📊 BENCHMARK COMPARISON");
  console.log("=".repeat(80));
  console.log(`Baseline: ${new Date(baseline.timestamp).toISOString()}`);
  console.log(`  Runtime: Bun ${baseline.runtime.bun} (${baseline.runtime.platform})`);
  console.log(`Current:  ${new Date(current.timestamp).toISOString()}`);
  console.log(`  Runtime: Bun ${current.runtime.bun} (${current.runtime.platform})`);
  console.log("=".repeat(80) + "\n");

  // Create lookup map
  const baselineMap = new Map(baseline.results.map((r) => [r.name, r]));

  let improvements = 0;
  let regressions = 0;
  let unchanged = 0;
  let newBenchmarks = 0;
  let removed = 0;

  // Check current results
  for (const currentResult of current.results) {
    const baselineResult = baselineMap.get(currentResult.name);

    if (!baselineResult) {
      console.log(`🆕 ${currentResult.name} (NEW)`);
      console.log(`   ${formatOps(currentResult.opsPerSec)}\n`);
      newBenchmarks++;
      continue;
    }

    const change =
      ((currentResult.opsPerSec - baselineResult.opsPerSec) / baselineResult.opsPerSec) * 100;
    const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

    let icon = "→";
    if (change > 5) {
      icon = "✅";
      improvements++;
    } else if (change < -5) {
      icon = "❌";
      regressions++;
    } else {
      icon = "→";
      unchanged++;
    }

    console.log(`${icon} ${currentResult.name}`);
    console.log(
      `   ${formatOps(baselineResult.opsPerSec)} → ${formatOps(currentResult.opsPerSec)} (${changeStr})`,
    );

    if (Math.abs(change) > 5) {
      const timeChange =
        ((currentResult.avgTime - baselineResult.avgTime) / baselineResult.avgTime) * 100;
      console.log(
        `   Time: ${formatTime(baselineResult.avgTime)} → ${formatTime(currentResult.avgTime)} (${timeChange > 0 ? "+" : ""}${timeChange.toFixed(2)}%)`,
      );
    }
    console.log("");
  }

  // Check for removed benchmarks
  for (const baselineResult of baseline.results) {
    const currentResult = current.results.find((r) => r.name === baselineResult.name);
    if (!currentResult) {
      console.log(`🗑️  ${baselineResult.name} (REMOVED)`);
      removed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total benchmarks: ${current.results.length}`);
  console.log(`Improvements: ${improvements} (>${5}% faster)`);
  console.log(`Regressions:  ${regressions} (>${5}% slower)`);
  console.log(`Unchanged:    ${unchanged} (±${5}%)`);
  console.log(`New:          ${newBenchmarks}`);
  console.log(`Removed:      ${removed}`);

  const overallChange =
    current.results.reduce((sum, r) => {
      const baseline = baselineMap.get(r.name);
      if (!baseline) return sum;
      return sum + ((r.opsPerSec - baseline.opsPerSec) / baseline.opsPerSec) * 100;
    }, 0) / current.results.filter((r) => baselineMap.has(r.name)).length;

  console.log(`Overall change: ${overallChange > 0 ? "+" : ""}${overallChange.toFixed(2)}%`);
  console.log("=".repeat(80) + "\n");

  // Exit with error if regressions found
  if (regressions > 0) {
    console.error(`⚠️  Found ${regressions} performance regressions!`);
    process.exit(1);
  }

  console.log("✅ No performance regressions detected");
}

function formatOps(opsPerSec: number): string {
  if (opsPerSec >= 1_000_000) {
    return `${(opsPerSec / 1_000_000).toFixed(2)}M ops/sec`;
  } else if (opsPerSec >= 1_000) {
    return `${(opsPerSec / 1_000).toFixed(2)}K ops/sec`;
  }
  return `${opsPerSec.toFixed(2)} ops/sec`;
}

function formatTime(microseconds: number): string {
  if (microseconds < 1) {
    return `${(microseconds * 1000).toFixed(2)}ns`;
  } else if (microseconds < 1000) {
    return `${microseconds.toFixed(2)}μs`;
  } else if (microseconds < 1_000_000) {
    return `${(microseconds / 1000).toFixed(2)}ms`;
  }
  return `${(microseconds / 1_000_000).toFixed(2)}s`;
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: bun run benchmarks/compare.ts <baseline.json> <current.json>");
  console.error("");
  console.error("Example:");
  console.error("  bun run benchmarks/compare.ts baseline.json current.json");
  process.exit(1);
}

compare(args[0], args[1]).catch((error) => {
  console.error("Error comparing benchmarks:", error);
  process.exit(1);
});
