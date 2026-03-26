/**
 * Dependency resolver — recursively resolves pack dependencies from the registry.
 * Mirrors the depth-first approach of @ambrosia-unce/core's PackProcessor.
 */

import type { RegistryClient } from "./client";
import type { RegistryItem } from "./schema";

/**
 * Resolve a pack and all its registryDependencies recursively.
 * Returns packs in dependency order (dependencies before dependents).
 */
export async function resolveDependencies(
  packName: string,
  client: RegistryClient,
  resolved: Map<string, RegistryItem> = new Map(),
  chain: string[] = [],
): Promise<RegistryItem[]> {
  // Circular dependency detection
  if (chain.includes(packName)) {
    const cycle = [...chain, packName].join(" → ");
    throw new Error(`Circular registry dependency detected: ${cycle}`);
  }

  // Already resolved — skip
  if (resolved.has(packName)) {
    return Array.from(resolved.values());
  }

  const pack = await client.fetchPack(packName);
  const newChain = [...chain, packName];

  // Resolve registryDependencies first (depth-first)
  for (const dep of pack.registryDependencies) {
    await resolveDependencies(dep, client, resolved, newChain);
  }

  // Add this pack after its dependencies
  resolved.set(packName, pack);
  return Array.from(resolved.values());
}

/**
 * Collect all npm dependencies from a list of resolved registry items.
 * Merges dependencies, devDependencies, and ambrosiaDependencies.
 */
export function collectNpmDependencies(items: RegistryItem[]): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  for (const item of items) {
    for (const [name, version] of Object.entries(item.dependencies)) {
      dependencies[name] = version;
    }
    for (const [name, version] of Object.entries(item.devDependencies)) {
      devDependencies[name] = version;
    }
    for (const pkg of item.ambrosiaDependencies) {
      if (!dependencies[pkg]) {
        dependencies[pkg] = "latest";
      }
    }
  }

  return { dependencies, devDependencies };
}
