import { rmdir, unlink } from "node:fs/promises";
import * as p from "@clack/prompts";
import { requireConfig, saveConfig } from "../config/ambrosia-config";
import type { AmbrosiaConfig } from "../config/schema";
import { fileExists } from "../utils/fs";
import { pathDirname, pathJoin } from "../utils/path";

export async function removeCommand(packNames: string[]) {
  p.intro("ambrosia remove");

  if (packNames.length === 0) {
    p.log.error("Please specify at least one pack name.");
    console.log();
    console.log("  Example: ambrosia remove jwt-auth");
    console.log("           ambrosia remove jwt-auth redis-cache");
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

  const cwd = process.cwd();

  // Validate all packs are installed before removing any
  const notInstalled = packNames.filter((name) => !config.packs[name]);
  if (notInstalled.length > 0) {
    p.log.error(`Pack(s) not installed: ${notInstalled.join(", ")}`);
    process.exit(1);
  }

  const removeSpinner = p.spinner();
  removeSpinner.start("Removing packs...");

  let removedCount = 0;

  for (const name of packNames) {
    const entry = config.packs[name];

    // Delete files listed in the config entry
    for (const filePath of entry.files) {
      const fullPath = pathJoin(cwd, filePath);
      if (await fileExists(fullPath)) {
        await unlink(fullPath);
      }
    }

    // Remove empty directories (walk up from each file)
    const dirs = new Set<string>();
    for (const filePath of entry.files) {
      let dir = pathDirname(pathJoin(cwd, filePath));
      while (dir !== cwd && dir !== ".") {
        dirs.add(dir);
        dir = pathDirname(dir);
      }
    }

    // Sort by depth (deepest first) to remove children before parents
    const sortedDirs = Array.from(dirs).sort((a, b) => b.length - a.length);
    for (const dir of sortedDirs) {
      try {
        await rmdir(dir);
      } catch {
        // Directory not empty or doesn't exist — skip
      }
    }

    // Remove entry from config
    delete config.packs[name];
    removedCount++;
  }

  removeSpinner.stop(`Removed ${removedCount} pack(s)`);

  // Save updated config
  await saveConfig(config, cwd);

  p.outro("Done!");
}
