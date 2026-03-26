/**
 * Registry types — duplicated from @ambrosia-unce/cli registry/schema.ts
 * to avoid cross-package imports. Keep in sync with the CLI types.
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

export interface RegistryFile {
  path: string;
  content: string;
  type: RegistryFileType;
}

export interface RegistryItem {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: PackCategory;
  files: RegistryFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  registryDependencies: string[];
  ambrosiaDependencies: string[];
}

export interface RegistryIndex {
  packs: RegistryIndexEntry[];
}

export interface RegistryIndexEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  category: PackCategory;
  tags: string[];
}

export interface ManifestFile {
  path: string;
  type: RegistryFileType;
}

export interface ManifestItem {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: PackCategory;
  files: ManifestFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  registryDependencies: string[];
  ambrosiaDependencies: string[];
}

export interface RegistryManifest {
  $schema?: string;
  name: string;
  items: ManifestItem[];
}
