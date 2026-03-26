import * as p from "@clack/prompts";
import { requireConfig } from "../config/ambrosia-config";
import type { AmbrosiaConfig } from "../config/schema";

export async function listCommand() {
  p.intro("ambrosia list");

  // Load project config
  let config: AmbrosiaConfig;
  try {
    config = await requireConfig();
  } catch (err) {
    p.log.error((err as Error).message);
    process.exit(1);
  }

  const entries = Object.entries(config.packs);

  if (entries.length === 0) {
    p.log.info("No packs installed.");
    p.outro("");
    return;
  }

  // Format as table
  const nameWidth = Math.max(4, ...entries.map(([name]) => name.length));
  const versionWidth = Math.max(7, ...entries.map(([, e]) => e.version.length));
  const registryWidth = Math.max(8, ...entries.map(([, e]) => e.registry.length));

  const header = [
    "Name".padEnd(nameWidth),
    "Version".padEnd(versionWidth),
    "Registry".padEnd(registryWidth),
    "Installed At",
  ].join("  ");

  const separator = [
    "─".repeat(nameWidth),
    "─".repeat(versionWidth),
    "─".repeat(registryWidth),
    "─".repeat(20),
  ].join("  ");

  const rows = entries.map(([name, entry]) =>
    [
      name.padEnd(nameWidth),
      entry.version.padEnd(versionWidth),
      entry.registry.padEnd(registryWidth),
      entry.installedAt,
    ].join("  "),
  );

  p.note([header, separator, ...rows].join("\n"), "Installed packs");

  p.outro("");
}
