import * as p from "@clack/prompts";
import { createDefaultConfig, loadConfig, saveConfig } from "../config/ambrosia-config";
import { CONFIG_FILENAME, DEFAULT_CONFIG } from "../config/schema";
import { fileExists } from "../utils/fs";
import { pathJoin } from "../utils/path";

export async function initCommand() {
  p.intro("ambrosia init");

  const cwd = process.cwd();

  // Check existing config
  const existing = await loadConfig(cwd);
  if (existing) {
    p.log.warn(`${CONFIG_FILENAME} already exists.`);
    const overwrite = await p.confirm({ message: "Overwrite?", initialValue: false });
    if (p.isCancel(overwrite) || !overwrite) {
      p.outro("Cancelled.");
      process.exit(0);
    }
  }

  // Verify project root
  if (!(await fileExists(pathJoin(cwd, "package.json")))) {
    p.log.error("No package.json found. Run this command in a project root.");
    process.exit(1);
  }

  // Detect structure and suggest packsDir
  const hasPacks = await fileExists(pathJoin(cwd, "src/packs"));
  const hasModules = await fileExists(pathJoin(cwd, "src/modules"));
  const suggested = hasPacks ? "src/packs" : hasModules ? "src/packs" : "src/packs";

  const packsDir = await p.text({
    message: "Where should packs be installed?",
    placeholder: suggested,
    defaultValue: suggested,
  });
  if (p.isCancel(packsDir)) {
    p.outro("Cancelled.");
    process.exit(0);
  }

  const registryUrl = await p.text({
    message: "Default registry URL:",
    placeholder: DEFAULT_CONFIG.registries.default,
    defaultValue: DEFAULT_CONFIG.registries.default,
  });
  if (p.isCancel(registryUrl)) {
    p.outro("Cancelled.");
    process.exit(0);
  }

  const config = createDefaultConfig({
    packsDir: packsDir as string,
    registries: { default: registryUrl as string },
  });
  await saveConfig(config, cwd);

  p.log.success(`Created ${CONFIG_FILENAME}`);
  p.note(`packs dir:  ${config.packsDir}\nregistry:   ${config.registries.default}`, "Config");
  p.outro('Ready! Use "ambrosia add <pack>" to install packs.');
}
