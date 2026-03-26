/**
 * `ambrosia publish` — build and publish a pack to the registry.
 * Reads registry.json manifest, validates, bumps version, builds, and outputs
 * a publishable JSON payload.
 */

import * as p from "@clack/prompts";
import type { ManifestItem, RegistryFile, RegistryItem, RegistryManifest } from "../registry/schema.ts";
import { fileExists, readJson, writeJson } from "../utils/fs.ts";
import { pathBasename, pathDirname, pathJoin } from "../utils/path.ts";

const MANIFEST_FILENAME = "registry.json";
const OUTPUT_DIR = "dist/registry";

export async function publishCommand() {
  p.intro("ambrosia publish");

  const cwd = process.cwd();
  const manifestPath = pathJoin(cwd, MANIFEST_FILENAME);

  // 1. Read registry.json
  if (!(await fileExists(manifestPath))) {
    p.log.error(`No ${MANIFEST_FILENAME} found in current directory.`);
    console.log();
    console.log("  Create a registry.json manifest to define your packs.");
    console.log('  Then run "ambrosia build" to generate distributable JSON.');
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
    p.outro("Nothing to publish.");
    return;
  }

  // 2. Select which pack to publish (if multiple)
  let item: ManifestItem;
  if (manifest.items.length === 1) {
    item = manifest.items[0];
  } else {
    const selected = await p.select({
      message: "Select pack to publish:",
      options: manifest.items.map((i) => ({
        value: i.name,
        label: `${i.name}@${i.version}`,
        hint: i.description,
      })),
    });

    if (p.isCancel(selected)) {
      p.outro("Cancelled.");
      process.exit(0);
    }

    item = manifest.items.find((i) => i.name === selected)!;
  }

  // 3. Validate required fields
  const missing: string[] = [];
  if (!item.name) missing.push("name");
  if (!item.version) missing.push("version");
  if (!item.description) missing.push("description");
  if (!item.files || item.files.length === 0) missing.push("files");

  if (missing.length > 0) {
    p.log.error(`Missing required fields: ${missing.join(", ")}`);
    process.exit(1);
  }

  p.log.step(`Publishing ${item.name}@${item.version}`);

  // 4. Bump version
  const bumpType = await p.select({
    message: `Current version: ${item.version}. Bump?`,
    options: [
      { value: "none", label: `Keep ${item.version}`, hint: "no version change" },
      { value: "patch", label: bumpVersion(item.version, "patch"), hint: "bug fixes" },
      { value: "minor", label: bumpVersion(item.version, "minor"), hint: "new features" },
      { value: "major", label: bumpVersion(item.version, "major"), hint: "breaking changes" },
      { value: "custom", label: "Custom version", hint: "enter manually" },
    ],
  });

  if (p.isCancel(bumpType)) {
    p.outro("Cancelled.");
    process.exit(0);
  }

  let newVersion = item.version;
  if (bumpType !== "none") {
    if (bumpType === "custom") {
      const customVersion = await p.text({
        message: "Enter version:",
        placeholder: item.version,
        validate: (val) => {
          if (!/^\d+\.\d+\.\d+/.test(val)) return "Must be valid semver (e.g. 1.2.3).";
          return undefined;
        },
      });

      if (p.isCancel(customVersion)) {
        p.outro("Cancelled.");
        process.exit(0);
      }
      newVersion = customVersion as string;
    } else {
      newVersion = bumpVersion(item.version, bumpType as "patch" | "minor" | "major");
    }
  }

  // 5. Build pack files
  const buildSpinner = p.spinner();
  buildSpinner.start("Building pack...");

  let registryItem: RegistryItem;
  try {
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

    registryItem = {
      name: item.name,
      version: newVersion,
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

    buildSpinner.stop(`Built ${files.length} file(s)`);
  } catch (err) {
    buildSpinner.stop("Build failed");
    p.log.error((err as Error).message);
    process.exit(1);
  }

  // 6. Write distributable JSON
  const writeSpinner = p.spinner();
  writeSpinner.start("Writing output...");

  const outDir = pathJoin(cwd, OUTPUT_DIR);
  const { mkdirp } = await import("../utils/fs.ts");
  await mkdirp(outDir);

  const outPath = pathJoin(outDir, `${item.name}.json`);
  await Bun.write(outPath, `${JSON.stringify(registryItem, null, 2)}\n`);

  writeSpinner.stop(`Written to ${OUTPUT_DIR}/${item.name}.json`);

  // 7. Update registry.json with new version
  if (newVersion !== item.version) {
    item.version = newVersion;
    await writeJson(manifestPath, manifest);
    p.log.step(`Updated ${MANIFEST_FILENAME} to version ${newVersion}`);
  }

  p.log.success(`${item.name}@${newVersion} ready for publishing`);

  p.note(
    [
      `Output: ${OUTPUT_DIR}/${item.name}.json`,
      "",
      "To publish to a registry, host this file on a static server",
      "or upload it to your registry endpoint.",
    ].join("\n"),
    "Next steps",
  );

  p.outro("Done!");
}

/** Bump a semver version string. */
function bumpVersion(version: string, type: "patch" | "minor" | "major"): string {
  const parts = version.split(".").map(Number);
  if (parts.length < 3) return version;

  switch (type) {
    case "patch":
      parts[2]++;
      break;
    case "minor":
      parts[1]++;
      parts[2] = 0;
      break;
    case "major":
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
  }

  return parts.join(".");
}
