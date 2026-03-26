/**
 * `ambrosia info` — display project and environment information.
 */

import * as p from "@clack/prompts";
import { loadConfig } from "../config/ambrosia-config.ts";
import { fileExists, readJson } from "../utils/fs.ts";
import { pathJoin } from "../utils/path.ts";

export async function infoCommand() {
  p.intro("ambrosia info");

  const cwd = process.cwd();
  const lines: string[] = [];

  // CLI version
  try {
    const pkg = await import("../../package.json");
    lines.push(`@ambrosia/cli:  v${pkg.version}`);
  } catch {
    lines.push("@ambrosia/cli:  unknown");
  }

  // Bun version
  try {
    const proc = Bun.spawn(["bun", "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    lines.push(`Bun:            v${output.trim()}`);
  } catch {
    lines.push("Bun:            not found");
  }

  // OS/Platform
  lines.push(`Platform:       ${process.platform} ${process.arch}`);

  // @ambrosia/* package versions
  const pkgJsonPath = pathJoin(cwd, "package.json");
  if (await fileExists(pkgJsonPath)) {
    try {
      const pkgJson = await readJson<{
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(pkgJsonPath);

      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      const ambrosiaPkgs = Object.entries(allDeps)
        .filter(([name]) => name.startsWith("@ambrosia/"))
        .sort(([a], [b]) => a.localeCompare(b));

      if (ambrosiaPkgs.length > 0) {
        lines.push("");
        lines.push("Packages:");
        for (const [name, version] of ambrosiaPkgs) {
          lines.push(`  ${name.padEnd(24)} ${version}`);
        }
      }
    } catch {
      // skip
    }
  }

  // Config info
  const config = await loadConfig(cwd);
  if (config) {
    const packCount = Object.keys(config.packs).length;
    lines.push("");
    lines.push("Project:");
    lines.push(`  Packs dir:    ${config.packsDir}`);
    lines.push(`  Installed:    ${packCount} pack(s)`);
    lines.push(`  Registry:     ${config.registries.default}`);

    // Additional registries
    const extraRegistries = Object.keys(config.registries).filter((k) => k !== "default");
    if (extraRegistries.length > 0) {
      for (const name of extraRegistries) {
        lines.push(`  Registry (${name}): ${config.registries[name]}`);
      }
    }
  }

  p.note(lines.join("\n"), "Environment");
  p.outro("");
}
