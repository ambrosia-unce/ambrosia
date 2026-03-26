import { fileExists, readJson, writeJson } from "../utils/fs";
import { pathJoin } from "../utils/path";
import { type AmbrosiaConfig, CONFIG_FILENAME, DEFAULT_CONFIG } from "./schema";

/** Read ambrosia.json from project root. Returns null if not found. */
export async function loadConfig(cwd?: string): Promise<AmbrosiaConfig | null> {
  const root = cwd ?? process.cwd();
  const configPath = pathJoin(root, CONFIG_FILENAME);
  if (!(await fileExists(configPath))) return null;
  return readJson<AmbrosiaConfig>(configPath);
}

/** Write ambrosia.json to project root. */
export async function saveConfig(config: AmbrosiaConfig, cwd?: string): Promise<void> {
  const root = cwd ?? process.cwd();
  await writeJson(pathJoin(root, CONFIG_FILENAME), config);
}

/** Load config or throw with actionable message. */
export async function requireConfig(cwd?: string): Promise<AmbrosiaConfig> {
  const config = await loadConfig(cwd);
  if (!config) {
    throw new Error('No ambrosia.json found. Run "ambrosia init" to create one.');
  }
  return config;
}

/** Create a fresh config merging defaults with overrides. */
export function createDefaultConfig(overrides?: Partial<AmbrosiaConfig>): AmbrosiaConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    registries: { ...DEFAULT_CONFIG.registries, ...overrides?.registries },
    packs: {},
  };
}
