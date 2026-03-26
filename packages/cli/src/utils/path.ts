/**
 * Bun-native path utilities — no `node:path` dependency.
 * All paths use forward slashes internally.
 */

/** Join path segments with forward slashes, normalizing doubles. */
export function pathJoin(...segments: string[]): string {
  return segments.join("/").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

/** Resolve a target against a base directory. Absolute targets pass through. */
export function pathResolve(base: string, target: string): string {
  if (target.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(target)) {
    return target.replace(/\\/g, "/");
  }
  return pathJoin(base, target);
}

/** Get the last segment of a path (equivalent to basename). */
export function pathBasename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/").replace(/\/$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

/** Get the directory part of a path (equivalent to dirname). */
export function pathDirname(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/").replace(/\/$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? "." : normalized.slice(0, lastSlash);
}

/**
 * Validate that a resolved file path stays within the expected base directory.
 * Prevents path traversal attacks (e.g. "../../etc/passwd").
 *
 * @param baseDir - The trusted base directory
 * @param filePath - The file path to validate (relative to baseDir)
 * @returns The resolved safe path
 * @throws If the path escapes baseDir
 */
export function safePath(baseDir: string, filePath: string): string {
  // Normalize separators
  const normalizedBase = baseDir.replace(/\\/g, "/").replace(/\/+$/, "");
  const resolved = pathJoin(normalizedBase, filePath);

  // Ensure resolved path starts with base directory
  if (!resolved.startsWith(normalizedBase + "/") && resolved !== normalizedBase) {
    throw new Error(`Path traversal detected: "${filePath}" resolves outside "${baseDir}"`);
  }

  return resolved;
}
