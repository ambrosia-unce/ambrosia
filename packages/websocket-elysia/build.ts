import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  external: ["@ambrosia-unce/websocket", "elysia"],
});

console.log("JavaScript build complete");

const tsc = Bun.spawn(
  ["bunx", "tsc", "--emitDeclarationOnly", "--declaration", "--noEmit", "false", "--outDir", "dist"],
  { cwd: import.meta.dir, stdout: "pipe", stderr: "pipe" },
);
await tsc.exited;

if (tsc.exitCode !== 0) {
  const stderr = await new Response(tsc.stderr).text();
  console.error("Type declaration generation failed:");
  console.error(stderr);
  process.exit(1);
}

console.log("Type declarations generated");

async function fixDtsFiles(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await fixDtsFiles(fullPath);
    } else if (entry.name.endsWith(".d.ts")) {
      let content = await readFile(fullPath, "utf-8");
      content = content.replace(/from\s+["'](.+?)\.ts["']/g, 'from "$1"');
      await writeFile(fullPath, content, "utf-8");
    }
  }
}

await fixDtsFiles("./dist");
console.log("Build complete");
