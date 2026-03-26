/**
 * `ambrosia upgrade` — upgrade @ambrosia-unce/* packages to their latest versions.
 */

import * as p from "@clack/prompts";
import { fileExists, readJson } from "../utils/fs.ts";
import { pathJoin } from "../utils/path.ts";

interface NpmRegistryResponse {
  "dist-tags"?: { latest?: string };
}

export async function upgradeCommand() {
  p.intro("ambrosia upgrade");

  const cwd = process.cwd();
  const pkgJsonPath = pathJoin(cwd, "package.json");

  if (!(await fileExists(pkgJsonPath))) {
    p.log.error("No package.json found in current directory.");
    process.exit(1);
  }

  let pkgJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    pkgJson = await readJson(pkgJsonPath);
  } catch (err) {
    p.log.error(`Failed to parse package.json: ${(err as Error).message}`);
    process.exit(1);
  }

  const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  const ambrosiaPkgs = Object.entries(allDeps)
    .filter(([name]) => name.startsWith("@ambrosia-unce/"))
    .sort(([a], [b]) => a.localeCompare(b));

  if (ambrosiaPkgs.length === 0) {
    p.log.info("No @ambrosia-unce/* packages found in dependencies.");
    p.outro("");
    return;
  }

  // Check latest versions from npm
  const checkSpinner = p.spinner();
  checkSpinner.start("Checking for updates...");

  const updates: { name: string; current: string; latest: string; isDev: boolean }[] = [];
  const errors: string[] = [];

  for (const [name, currentVersion] of ambrosiaPkgs) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${name}`);
      if (!response.ok) {
        errors.push(`${name}: registry returned ${response.status}`);
        continue;
      }
      const data = (await response.json()) as NpmRegistryResponse;
      const latest = data["dist-tags"]?.latest;

      if (latest && latest !== stripVersionPrefix(currentVersion)) {
        const isDev = name in (pkgJson.devDependencies ?? {});
        updates.push({ name, current: currentVersion, latest, isDev });
      }
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  }

  checkSpinner.stop("Check complete");

  if (errors.length > 0) {
    for (const err of errors) {
      p.log.warn(err);
    }
  }

  if (updates.length === 0) {
    p.log.success("All @ambrosia-unce/* packages are up to date.");
    p.outro("");
    return;
  }

  // Show what can be upgraded
  const summary = updates
    .map((u) => `  ${u.name}: ${u.current} \u2192 ${u.latest}`)
    .join("\n");

  p.log.info(`Updates available:\n${summary}`);

  // Confirm
  const confirmed = await p.confirm({
    message: `Upgrade ${updates.length} package(s)?`,
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro("Cancelled.");
    process.exit(0);
  }

  // Run bun update for each group
  const upgradeSpinner = p.spinner();
  upgradeSpinner.start("Upgrading packages...");

  try {
    const deps = updates.filter((u) => !u.isDev).map((u) => `${u.name}@${u.latest}`);
    const devDeps = updates.filter((u) => u.isDev).map((u) => `${u.name}@${u.latest}`);

    if (deps.length > 0) {
      const proc = Bun.spawn(["bun", "add", ...deps], {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;
    }

    if (devDeps.length > 0) {
      const proc = Bun.spawn(["bun", "add", "-D", ...devDeps], {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;
    }

    upgradeSpinner.stop(`Upgraded ${updates.length} package(s)`);
  } catch {
    upgradeSpinner.stop("Upgrade failed");
    p.log.warn('Some packages may not have been upgraded. Run "bun install" manually.');
  }

  p.outro("Done!");
}

/** Strip version prefix characters (^, ~, =) to get bare version. */
function stripVersionPrefix(version: string): string {
  return version.replace(/^[\^~>=<]+/, "");
}
