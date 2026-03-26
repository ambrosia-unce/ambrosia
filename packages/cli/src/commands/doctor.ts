/**
 * `ambrosia doctor` — check project health and diagnose common issues.
 */

import * as p from "@clack/prompts";
import { loadConfig } from "../config/ambrosia-config.ts";
import { fileExists, readJson } from "../utils/fs.ts";
import { pathJoin } from "../utils/path.ts";

interface CheckResult {
  label: string;
  ok: boolean;
  message: string;
}

export async function doctorCommand() {
  p.intro("ambrosia doctor");

  const cwd = process.cwd();
  const results: CheckResult[] = [];

  const spinner = p.spinner();
  spinner.start("Running health checks...");

  // 1. Check Bun version
  try {
    const proc = Bun.spawn(["bun", "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    const version = output.trim();
    const major = Number.parseInt(version.split(".")[0], 10);
    results.push({
      label: "Bun runtime",
      ok: major >= 1,
      message: major >= 1 ? `v${version}` : `v${version} (requires >= 1.0)`,
    });
  } catch {
    results.push({ label: "Bun runtime", ok: false, message: "Not found" });
  }

  // 2. Check ambrosia.json
  const config = await loadConfig(cwd);
  if (config) {
    results.push({ label: "ambrosia.json", ok: true, message: "Found and valid" });

    // Validate config structure
    const hasPacksDir = typeof config.packsDir === "string" && config.packsDir.length > 0;
    const hasRegistries =
      config.registries && typeof config.registries.default === "string";
    results.push({
      label: "Config structure",
      ok: hasPacksDir && !!hasRegistries,
      message: hasPacksDir && hasRegistries ? "packsDir and registries configured" : "Missing required fields",
    });
  } else {
    results.push({
      label: "ambrosia.json",
      ok: false,
      message: 'Not found. Run "ambrosia init" to create one.',
    });
  }

  // 3. Check installed packs have their files
  if (config && Object.keys(config.packs).length > 0) {
    let allPresent = true;
    const missingFiles: string[] = [];

    for (const [name, entry] of Object.entries(config.packs)) {
      for (const filePath of entry.files) {
        const fullPath = pathJoin(cwd, filePath);
        if (!(await fileExists(fullPath))) {
          allPresent = false;
          missingFiles.push(`${name}: ${filePath}`);
        }
      }
    }

    results.push({
      label: "Pack files integrity",
      ok: allPresent,
      message: allPresent
        ? `${Object.keys(config.packs).length} pack(s) — all files present`
        : `Missing files:\n    ${missingFiles.slice(0, 5).join("\n    ")}${missingFiles.length > 5 ? `\n    ... and ${missingFiles.length - 5} more` : ""}`,
    });
  }

  // 4. Check @ambrosia-unce/* packages
  const pkgJsonPath = pathJoin(cwd, "package.json");
  if (await fileExists(pkgJsonPath)) {
    try {
      const pkgJson = await readJson<{
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(pkgJsonPath);

      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      const ambrosiaPkgs = Object.entries(allDeps).filter(([name]) => name.startsWith("@ambrosia-unce/"));

      if (ambrosiaPkgs.length > 0) {
        const versions = ambrosiaPkgs.map(([name, version]) => `${name}@${version}`).join(", ");
        results.push({
          label: "@ambrosia-unce/* packages",
          ok: true,
          message: versions,
        });
      } else {
        results.push({
          label: "@ambrosia-unce/* packages",
          ok: false,
          message: "No @ambrosia-unce/* packages found in dependencies",
        });
      }

      // 5. Check reflect-metadata
      const hasReflectMetadata = "reflect-metadata" in (pkgJson.dependencies ?? {});
      results.push({
        label: "reflect-metadata",
        ok: hasReflectMetadata,
        message: hasReflectMetadata
          ? `${allDeps["reflect-metadata"]}`
          : "Not in dependencies. Required for DI decorators.",
      });
    } catch {
      results.push({ label: "package.json", ok: false, message: "Failed to parse" });
    }
  } else {
    results.push({ label: "package.json", ok: false, message: "Not found" });
  }

  // 6. Check tsconfig has decorators enabled
  const tsconfigPath = pathJoin(cwd, "tsconfig.json");
  if (await fileExists(tsconfigPath)) {
    try {
      const rawContent = await Bun.file(tsconfigPath).text();
      const hasExperimentalDecorators = rawContent.includes("experimentalDecorators");
      const hasEmitDecoratorMetadata = rawContent.includes("emitDecoratorMetadata");

      results.push({
        label: "TypeScript decorators",
        ok: hasExperimentalDecorators && hasEmitDecoratorMetadata,
        message:
          hasExperimentalDecorators && hasEmitDecoratorMetadata
            ? "experimentalDecorators + emitDecoratorMetadata enabled"
            : [
                !hasExperimentalDecorators ? "Missing experimentalDecorators" : "",
                !hasEmitDecoratorMetadata ? "Missing emitDecoratorMetadata" : "",
              ]
                .filter(Boolean)
                .join(", "),
      });
    } catch {
      results.push({ label: "tsconfig.json", ok: false, message: "Failed to read" });
    }
  } else {
    results.push({ label: "tsconfig.json", ok: false, message: "Not found" });
  }

  spinner.stop("Health checks complete");

  // Display results
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  const output = results
    .map((r) => {
      const icon = r.ok ? "\x1b[32m\u2714\x1b[0m" : "\x1b[31m\u2718\x1b[0m";
      return `  ${icon}  ${r.label}: ${r.message}`;
    })
    .join("\n");

  p.note(output, "Results");

  if (failed > 0) {
    p.log.warn(`${passed} passed, ${failed} failed`);
  } else {
    p.log.success(`All ${passed} checks passed`);
  }

  p.outro("");
}
