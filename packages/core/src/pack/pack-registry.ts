/**
 * PackRegistry — tracks loaded packs for introspection and discovery.
 */

import type { PackDefinition, PackMetadata } from "./types.ts";

export interface LoadedPackInfo {
  pack: PackDefinition;
  metadata: PackMetadata;
  loadedAt: number;
  providerCount: number;
  exportCount: number;
}

export class PackRegistry {
  private packs = new Map<string, LoadedPackInfo>();
  private anonymousCounter = 0;

  register(pack: PackDefinition): string {
    const name = pack.meta?.name || `anonymous-${++this.anonymousCounter}`;

    this.packs.set(name, {
      pack,
      metadata: pack.meta || { name },
      loadedAt: Date.now(),
      providerCount: pack.providers?.length || 0,
      exportCount: pack.exports?.length || 0,
    });

    return name;
  }

  getAll(): LoadedPackInfo[] {
    return Array.from(this.packs.values());
  }

  get(name: string): LoadedPackInfo | undefined {
    return this.packs.get(name);
  }

  has(name: string): boolean {
    return this.packs.has(name);
  }

  findByTag(tag: string): LoadedPackInfo[] {
    return this.getAll().filter((info) => info.metadata.tags?.includes(tag));
  }

  count(): number {
    return this.packs.size;
  }

  clear(): void {
    this.packs.clear();
    this.anonymousCounter = 0;
  }
}

export const packRegistry = new PackRegistry();
