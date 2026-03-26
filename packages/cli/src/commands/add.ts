import * as p from "@clack/prompts";
import { requireConfig, saveConfig } from "../config/ambrosia-config";
import type { AmbrosiaConfig } from "../config/schema";
import { createClient } from "../registry/client";
import { collectNpmDependencies, resolveDependencies } from "../registry/resolver";
import type { RegistryItem } from "../registry/schema";
import { mkdirp } from "../utils/fs";
import { pathDirname, pathJoin, safePath } from "../utils/path";

export async function addCommand(packNames: string[], flags: { registry?: string }) {
  p.intro("ambrosia add");

  if (packNames.length === 0) {
    p.log.error("Please specify at least one pack name.");
    console.log();
    console.log("  Example: ambrosia add jwt-auth");
    console.log("           ambrosia add jwt-auth redis-cache");
    console.log("           ambrosia add my-pack --registry company");
    console.log();
    process.exit(1);
  }

  // Load project config
  let config: AmbrosiaConfig;
  try {
    config = await requireConfig();
  } catch (err) {
    p.log.error((err as Error).message);
    process.exit(1);
  }

  const registryName = flags.registry ?? "default";
  const client = createClient(config.registries, registryName);
  const cwd = process.cwd();

  // Resolve all packs and their dependencies
  const resolveSpinner = p.spinner();
  resolveSpinner.start("Resolving dependencies...");

  let allPacks: RegistryItem[];
  try {
    const resolved = new Map<string, RegistryItem>();
    for (const name of packNames) {
      await resolveDependencies(name, client, resolved);
    }
    allPacks = Array.from(resolved.values());
    resolveSpinner.stop(`Resolved ${allPacks.length} pack(s)`);
  } catch (err) {
    resolveSpinner.stop("Failed to resolve dependencies");
    p.log.error((err as Error).message);
    process.exit(1);
  }

  // Check which packs are already installed
  const alreadyInstalled = allPacks.filter((pack) => config.packs[pack.name]);
  const newPacks = allPacks.filter((pack) => !config.packs[pack.name]);

  if (alreadyInstalled.length > 0) {
    const names = alreadyInstalled.map((p) => p.name).join(", ");
    const overwrite = await p.confirm({
      message: `Pack(s) already installed: ${names}. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      if (newPacks.length === 0) {
        p.outro("Nothing to install.");
        process.exit(0);
      }
      // Only install new packs
    } else {
      // Include already installed packs for overwrite
      newPacks.push(...alreadyInstalled);
    }
  }

  if (newPacks.length === 0) {
    p.outro("All packs already installed.");
    return;
  }

  // Write pack files
  const writeSpinner = p.spinner();
  writeSpinner.start("Installing packs...");

  for (const pack of newPacks) {
    const packDir = pathJoin(cwd, config.packsDir, pack.name);
    await mkdirp(packDir);

    const writtenFiles: string[] = [];
    for (const file of pack.files) {
      // Validate file path stays within pack directory (prevent path traversal)
      const filePath = safePath(packDir, file.path);
      const fileDir = pathDirname(filePath);
      if (fileDir !== packDir) {
        await mkdirp(fileDir);
      }
      await Bun.write(filePath, file.content);
      writtenFiles.push(pathJoin(config.packsDir, pack.name, file.path));
    }

    config.packs[pack.name] = {
      version: pack.version,
      registry: registryName,
      installedAt: new Date().toISOString(),
      files: writtenFiles,
    };
  }

  writeSpinner.stop(`Installed ${newPacks.length} pack(s)`);

  // Install npm dependencies
  const { dependencies, devDependencies } = collectNpmDependencies(newPacks);
  const depsToInstall = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`);
  const devDepsToInstall = Object.entries(devDependencies).map(
    ([name, version]) => `${name}@${version}`,
  );

  if (depsToInstall.length > 0 || devDepsToInstall.length > 0) {
    const depsSpinner = p.spinner();
    depsSpinner.start("Installing npm dependencies...");

    try {
      if (depsToInstall.length > 0) {
        const proc = Bun.spawn(["bun", "add", ...depsToInstall], {
          cwd,
          stdout: "pipe",
          stderr: "pipe",
        });
        await proc.exited;
      }
      if (devDepsToInstall.length > 0) {
        const proc = Bun.spawn(["bun", "add", "-D", ...devDepsToInstall], {
          cwd,
          stdout: "pipe",
          stderr: "pipe",
        });
        await proc.exited;
      }
      depsSpinner.stop("Dependencies installed");
    } catch {
      depsSpinner.stop("Some dependencies failed to install");
      p.log.warn("Run 'bun install' manually to resolve missing dependencies.");
    }
  }

  // Save updated config
  await saveConfig(config, cwd);

  // Show import instructions
  const importLines = newPacks.map((pack) => {
    const pascalName = pack.name
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    return `  import { ${pascalName}Pack } from "./${config.packsDir}/${pack.name}";`;
  });

  p.note(
    [
      "Add to your packs array:",
      "",
      ...importLines,
      "",
      "packs: [",
      ...newPacks.map((pack) => {
        const pascalName = pack.name
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join("");
        return `  ${pascalName}Pack.forRoot({ /* config */ }),`;
      }),
      "]",
    ].join("\n"),
    "Usage",
  );

  p.outro("Done!");
}
