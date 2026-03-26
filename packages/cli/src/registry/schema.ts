/**
 * Registry schemas — defines the shape of registry items and index.
 * Analogous to shadcn's registry-item.json schema.
 */

export type RegistryFileType =
  | "pack"
  | "service"
  | "controller"
  | "guard"
  | "interceptor"
  | "pipe"
  | "filter"
  | "middleware"
  | "types"
  | "config"
  | "test"
  | "index"
  | "other";

export type PackCategory =
  | "http"
  | "database"
  | "auth"
  | "cache"
  | "logging"
  | "validation"
  | "testing"
  | "utils"
  | "microservices";

/** A single file within a registry pack. */
export interface RegistryFile {
  /** Relative path within the pack directory, e.g. "jwt-auth.service.ts" */
  path: string;
  /** Full file content (source code) */
  content: string;
  /** Semantic file type for categorization */
  type: RegistryFileType;
}

/** A complete pack definition served by the registry. */
export interface RegistryItem {
  /** Pack name (slug), e.g. "jwt-auth" */
  name: string;
  /** Semver version */
  version: string;
  /** Human-readable description */
  description: string;
  /** Author name or organization */
  author: string;
  /** Searchable tags */
  tags: string[];
  /** Category for marketplace grouping */
  category: PackCategory;
  /** Source files to copy into the project */
  files: RegistryFile[];
  /** npm runtime dependencies (name -> version range) */
  dependencies: Record<string, string>;
  /** npm dev dependencies */
  devDependencies: Record<string, string>;
  /** Other registry packs this depends on (fetched recursively) */
  registryDependencies: string[];
  /** Required @ambrosia/* packages (installed as npm deps if missing) */
  ambrosiaDependencies: string[];
}

/** Registry index — list of all available packs. */
export interface RegistryIndex {
  packs: RegistryIndexEntry[];
}

/** Summary entry in the registry index (no file contents). */
export interface RegistryIndexEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  category: PackCategory;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Registry Manifest — authoring format (like shadcn's registry.json)
// Used by `ambrosia build` to generate distributable RegistryItem JSON files.
// ---------------------------------------------------------------------------

/** File reference in the manifest — path only, no content (content is read at build time). */
export interface ManifestFile {
  /** Source file path relative to the manifest file, e.g. "packs/jwt-auth/index.ts" */
  path: string;
  /** Semantic file type */
  type: RegistryFileType;
}

/** A single pack entry in the manifest. */
export interface ManifestItem {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: PackCategory;
  /** Source files — paths only, content embedded during build. */
  files: ManifestFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  registryDependencies: string[];
  ambrosiaDependencies: string[];
}

/** registry.json — the authoring manifest for pack registry authors. */
export interface RegistryManifest {
  $schema?: string;
  /** Registry name identifier */
  name: string;
  /** Pack items to publish */
  items: ManifestItem[];
}
