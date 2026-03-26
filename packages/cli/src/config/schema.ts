/**
 * ambrosia.json — project-level pack configuration.
 * Analogous to shadcn's components.json.
 */

export interface AmbrosiaConfig {
  /** JSON schema URL for editor autocompletion */
  $schema?: string;

  /** Directory where packs are installed (relative to project root) */
  packsDir: string;

  /** Registry URL mapping. "default" is required. */
  registries: {
    default: string;
    [name: string]: string;
  };

  /** Record of installed packs, keyed by pack name (slug) */
  packs: Record<string, InstalledPackEntry>;
}

export interface InstalledPackEntry {
  /** Semver version that was installed */
  version: string;
  /** Which registry key this pack came from */
  registry: string;
  /** ISO timestamp of installation */
  installedAt: string;
  /** List of file paths relative to project root that were written */
  files: string[];
}

export const DEFAULT_CONFIG: AmbrosiaConfig = {
  $schema: "https://registry.ambrosia.dev/schema/ambrosia.json",
  packsDir: "src/packs",
  registries: {
    default: "https://registry.ambrosia.dev",
  },
  packs: {},
};

export const CONFIG_FILENAME = "ambrosia.json";
