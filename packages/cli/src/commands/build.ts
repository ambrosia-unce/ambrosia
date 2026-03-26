/**
 * `ambrosia build` — reads registry.json manifest, reads source files,
 * generates distributable RegistryItem JSON files.
 * Analogous to `shadcn build`.
 */

import * as p from "@clack/prompts";
import type {
  ManifestItem,
  RegistryFile,
  RegistryIndex,
  RegistryIndexEntry,
  RegistryItem,
  RegistryManifest,
} from "../registry/schema";
import { fileExists, mkdirp, readJson } from "../utils/fs";
import { pathBasename, pathDirname, pathJoin } from "../utils/path";

const MANIFEST_FILENAME = "registry.json";
const OUTPUT_DIR = "dist/registry";

export async function buildCommand() {
  p.intro("ambrosia build");

  const cwd = process.cwd();
  const manifestPath = pathJoin(cwd, MANIFEST_FILENAME);

  // 1. Read registry.json
  if (!(await fileExists(manifestPath))) {
    p.log.error(`No ${MANIFEST_FILENAME} found in current directory.`);
    console.log();
    console.log("  Create a registry.json manifest to define your packs.");
    console.log("  See: https://ambrosia.dev/docs/cli/registry/publishing");
    console.log();
    process.exit(1);
  }

  let manifest: RegistryManifest;
  try {
    manifest = await readJson<RegistryManifest>(manifestPath);
  } catch (err) {
    p.log.error(`Failed to parse ${MANIFEST_FILENAME}: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!manifest.items || manifest.items.length === 0) {
    p.log.warn("No items found in registry.json.");
    p.outro("Nothing to build.");
    return;
  }

  p.log.step(`Building ${manifest.items.length} pack(s) from "${manifest.name}" registry`);

  // 2. Create output directory
  const outDir = pathJoin(cwd, OUTPUT_DIR);
  await mkdirp(outDir);

  // 3. Build each pack
  const indexEntries: RegistryIndexEntry[] = [];
  let errors = 0;

  for (const item of manifest.items) {
    const spinner = p.spinner();
    spinner.start(`Building ${item.name}@${item.version}...`);

    try {
      const registryItem = await buildItem(cwd, item);
      const outPath = pathJoin(outDir, `${item.name}.json`);
      await Bun.write(outPath, `${JSON.stringify(registryItem, null, 2)}\n`);

      indexEntries.push({
        name: item.name,
        version: item.version,
        description: item.description,
        author: item.author,
        category: item.category,
        tags: item.tags,
      });

      spinner.stop(`${item.name}@${item.version} — ${item.files.length} files`);
    } catch (err) {
      spinner.stop(`${item.name} — failed`);
      p.log.error(`  ${(err as Error).message}`);
      errors++;
    }
  }

  // 4. Write index.json
  const index: RegistryIndex = { packs: indexEntries };
  await Bun.write(pathJoin(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

  // 5. Summary
  const built = manifest.items.length - errors;
  if (errors > 0) {
    p.log.warn(`Built ${built}/${manifest.items.length} packs (${errors} failed)`);
  } else {
    p.log.success(`Built ${built} pack(s) + index.json`);
  }

  p.note(
    `Output: ${OUTPUT_DIR}/\n\nHost these files on any static server to create a registry.`,
    "Next",
  );
  p.outro("Done!");
}

/** Read source files for a manifest item and build a full RegistryItem. */
async function buildItem(cwd: string, item: ManifestItem): Promise<RegistryItem> {
  const files: RegistryFile[] = [];

  for (const fileRef of item.files) {
    const filePath = pathJoin(cwd, fileRef.path);

    if (!(await fileExists(filePath))) {
      throw new Error(`File not found: ${fileRef.path}`);
    }

    const content = await Bun.file(filePath).text();

    files.push({
      path:
        pathBasename(pathDirname(fileRef.path)) === item.name
          ? fileRef.path.slice(fileRef.path.indexOf(item.name) + item.name.length + 1)
          : pathBasename(fileRef.path),
      content,
      type: fileRef.type,
    });
  }

  return {
    name: item.name,
    version: item.version,
    description: item.description,
    author: item.author,
    tags: item.tags,
    category: item.category,
    files,
    dependencies: item.dependencies,
    devDependencies: item.devDependencies,
    registryDependencies: item.registryDependencies,
    ambrosiaDependencies: item.ambrosiaDependencies,
  };
}
