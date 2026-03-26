/**
 * Main benchmark runner
 * Runs all benchmark suites and generates reports
 */

async function main() {
  console.log("🚀 Starting @ambrosia-unce/core benchmark suite...\n");
  console.log(`Runtime: Bun ${Bun.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("=".repeat(80) + "\n");

  // Run benchmarks with bun test
  // List all benchmark files explicitly
  const benchmarkFiles = [
    "./benchmarks/suites/01-core-di.bench.ts",
    "./benchmarks/suites/02-scopes.bench.ts",
    "./benchmarks/suites/03-plugins.bench.ts",
    "./benchmarks/suites/04-async.bench.ts",
    "./benchmarks/suites/05-memory.bench.ts",
    "./benchmarks/suites/06-real-world.bench.ts",
  ];

  const proc = Bun.spawn({
    cmd: ["bun", "test", "--bail", ...benchmarkFiles],
    stdout: "inherit",
    stderr: "inherit",
    cwd: process.cwd(),
  });

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    console.log("\n" + "=".repeat(80));
    console.log("✅ All benchmarks completed successfully!");
    console.log("=".repeat(80) + "\n");
  } else {
    console.error("\n" + "=".repeat(80));
    console.error("❌ Benchmarks failed with exit code:", exitCode);
    console.error("=".repeat(80) + "\n");
    process.exit(exitCode);
  }
}

main().catch((error) => {
  console.error("Fatal error running benchmarks:", error);
  process.exit(1);
});
