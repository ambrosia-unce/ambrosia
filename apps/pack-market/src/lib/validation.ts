import type { PackCategory } from "./registry-types";

const RESERVED_NAMES = [
  "index",
  "search",
  "submit",
  "api",
  "auth",
  "dashboard",
  "login",
];

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+/;
const MAX_FILE_SIZE = 100 * 1024; // 100KB per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total per pack
const MAX_FILES_PER_PACK = 50;

const VALID_CATEGORIES: PackCategory[] = [
  "http",
  "database",
  "auth",
  "cache",
  "logging",
  "validation",
  "testing",
  "utils",
  "microservices",
];

export interface ValidationError {
  field: string;
  message: string;
}

export function validateManifest(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    errors.push({ field: "manifest", message: "Manifest must be an object" });
    return errors;
  }

  const manifest = data as Record<string, unknown>;

  if (typeof manifest.name !== "string" || !manifest.name) {
    errors.push({ field: "name", message: "Manifest must have a name" });
  }

  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    errors.push({
      field: "items",
      message: "Manifest must have at least one item",
    });
    return errors;
  }

  for (let i = 0; i < manifest.items.length; i++) {
    const item = manifest.items[i] as Record<string, unknown>;
    const prefix = `items[${i}]`;

    if (typeof item.name !== "string" || !NAME_PATTERN.test(item.name)) {
      errors.push({
        field: `${prefix}.name`,
        message: `Pack name must match ${NAME_PATTERN} (lowercase, alphanumeric, hyphens)`,
      });
    } else if (RESERVED_NAMES.includes(item.name)) {
      errors.push({
        field: `${prefix}.name`,
        message: `"${item.name}" is a reserved name`,
      });
    }

    if (
      typeof item.version !== "string" ||
      !SEMVER_PATTERN.test(item.version)
    ) {
      errors.push({
        field: `${prefix}.version`,
        message: "Version must be semver (e.g. 1.0.0)",
      });
    }

    if (typeof item.description !== "string" || !item.description) {
      errors.push({
        field: `${prefix}.description`,
        message: "Description is required",
      });
    }

    if (typeof item.author !== "string" || !item.author) {
      errors.push({
        field: `${prefix}.author`,
        message: "Author is required",
      });
    }

    if (
      typeof item.category !== "string" ||
      !VALID_CATEGORIES.includes(item.category as PackCategory)
    ) {
      errors.push({
        field: `${prefix}.category`,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    if (!Array.isArray(item.files) || item.files.length === 0) {
      errors.push({
        field: `${prefix}.files`,
        message: "At least one file is required",
      });
    } else if (item.files.length > MAX_FILES_PER_PACK) {
      errors.push({
        field: `${prefix}.files`,
        message: `Maximum ${MAX_FILES_PER_PACK} files per pack`,
      });
    } else {
      for (const file of item.files as Array<Record<string, unknown>>) {
        if (typeof file.path !== "string") {
          errors.push({
            field: `${prefix}.files`,
            message: "Each file must have a path",
          });
        } else if (file.path.includes("..") || file.path.startsWith("/")) {
          errors.push({
            field: `${prefix}.files.path`,
            message: `Invalid file path: ${file.path}`,
          });
        }
      }
    }
  }

  return errors;
}

export function validateFileSizes(
  files: { path: string; content: string }[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  let totalSize = 0;

  for (const file of files) {
    const size = new TextEncoder().encode(file.content).length;
    totalSize += size;

    if (size > MAX_FILE_SIZE) {
      errors.push({
        field: `files.${file.path}`,
        message: `File exceeds ${MAX_FILE_SIZE / 1024}KB limit (${Math.round(size / 1024)}KB)`,
      });
    }
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    errors.push({
      field: "files",
      message: `Total size exceeds ${MAX_TOTAL_SIZE / 1024}KB limit (${Math.round(totalSize / 1024)}KB)`,
    });
  }

  return errors;
}
