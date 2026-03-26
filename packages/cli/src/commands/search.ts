import * as p from "@clack/prompts";
import { requireConfig } from "../config/ambrosia-config";
import type { AmbrosiaConfig } from "../config/schema";
import { createClient } from "../registry/client";

export async function searchCommand(query: string, flags: { registry?: string }) {
  p.intro("ambrosia search");

  if (!query) {
    p.log.error("Please specify a search query.");
    console.log();
    console.log("  Example: ambrosia search auth");
    console.log("           ambrosia search cache --registry company");
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

  const searchSpinner = p.spinner();
  searchSpinner.start(`Searching for "${query}"...`);

  try {
    const result = await client.search(query);

    if (result.packs.length === 0) {
      searchSpinner.stop("Search complete");
      p.log.info("No packs found.");
      p.outro("");
      return;
    }

    searchSpinner.stop(`Found ${result.packs.length} pack(s)`);

    // Format as table
    const nameWidth = Math.max(4, ...result.packs.map((p) => p.name.length));
    const versionWidth = Math.max(7, ...result.packs.map((p) => p.version.length));
    const categoryWidth = Math.max(8, ...result.packs.map((p) => p.category.length));

    const header = [
      "Name".padEnd(nameWidth),
      "Version".padEnd(versionWidth),
      "Category".padEnd(categoryWidth),
      "Description",
    ].join("  ");

    const separator = [
      "─".repeat(nameWidth),
      "─".repeat(versionWidth),
      "─".repeat(categoryWidth),
      "─".repeat(30),
    ].join("  ");

    const rows = result.packs.map((pack) =>
      [
        pack.name.padEnd(nameWidth),
        pack.version.padEnd(versionWidth),
        pack.category.padEnd(categoryWidth),
        pack.description,
      ].join("  "),
    );

    p.note([header, separator, ...rows].join("\n"), "Results");
  } catch (err) {
    searchSpinner.stop("Search failed");
    p.log.error((err as Error).message);
    process.exit(1);
  }

  p.outro("");
}
