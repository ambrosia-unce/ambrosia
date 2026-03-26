import * as p from "@clack/prompts";
import { requireConfig, saveConfig } from "../config/ambrosia-config";
import type { AmbrosiaConfig } from "../config/schema";
import { createClient } from "../registry/client";
import type { RegistryItem } from "../registry/schema";
import { mkdirp } from "../utils/fs";
import { pathDirname, pathJoin, safePath } from "../utils/path";

export async function updateCommand(packNames: string[]) {
  p.intro("ambrosia update");

  // Load project config
  let config: AmbrosiaConfig;
  try {
    config = await requireConfig();
  } catch (err) {
    p.log.error((err as Error).message);
    process.exit(1);
  }

  const cwd = process.cwd();

  // Determine which packs to update
  const installedEntries = Object.entries(config.packs);

  if (installedEntries.length === 0) {
    p.log.info("No packs installed.");
    p.outro("");
    return;
  }

  const packsToUpdate = packNames.length > 0 ? packNames : installedEntries.map(([name]) => name);

  // Validate specified packs are installed
  if (packNames.length > 0) {
    const notInstalled = packNames.filter((name) => !config.packs[name]);
    if (notInstalled.length > 0) {
      p.log.error(`Pack(s) not installed: ${notInstalled.join(", ")}`);
      process.exit(1);
    }
  }

  const checkSpinner = p.spinner();
  checkSpinner.start("Checking for updates...");

  const updates: { name: string; from: string; to: string; pack: RegistryItem }[] = [];
  const errors: string[] = [];

  for (const name of packsToUpdate) {
    const entry = config.packs[name];
    const registryName = entry.registry;
    const client = createClient(config.registries, registryName);

    try {
      const latest = await client.fetchPack(name);
      if (latest.version !== entry.version) {
        updates.push({ name, from: entry.version, to: latest.version, pack: latest });
      }
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  }

  if (errors.length > 0) {
    checkSpinner.stop("Some packs failed to check");
    for (const err of errors) {
      p.log.warn(err);
    }
  } else {
    checkSpinner.stop("Check complete");
  }

  if (updates.length === 0) {
    p.log.info("All packs are up to date.");
    p.outro("");
    return;
  }

  // Show what will be updated
  const summary = updates.map((u) => `  ${u.name}: ${u.from} → ${u.to}`).join("\n");
  p.log.info(`Updates available:\n${summary}`);

  // Apply updates
  const updateSpinner = p.spinner();
  updateSpinner.start("Updating packs...");

  for (const update of updates) {
    const pack = update.pack;
    const registryName = config.packs[update.name].registry;
    const packDir = pathJoin(cwd, config.packsDir, pack.name);
    await mkdirp(packDir);

    const writtenFiles: string[] = [];
    for (const file of pack.files) {
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

  updateSpinner.stop(`Updated ${updates.length} pack(s)`);

  // Save updated config
  await saveConfig(config, cwd);

  p.outro("Done!");
}
