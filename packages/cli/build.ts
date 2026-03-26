import Bun from "bun";

const result = await Bun.build({
  entrypoints: ["src/bin.ts"],
  outdir: "dist",
  target: "bun",
  format: "esm",
  external: ["@clack/prompts"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("CLI built successfully");
