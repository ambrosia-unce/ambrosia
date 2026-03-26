/**
 * Registry HTTP client — fetches pack definitions from a registry server.
 */

import type { RegistryIndex, RegistryItem } from "./schema";

export class RegistryClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /** Fetch the registry index (list of all available packs). */
  async fetchIndex(): Promise<RegistryIndex> {
    const url = `${this.baseUrl}/api/registry/index.json`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new Error(
        `Cannot connect to registry at ${this.baseUrl}: ${err instanceof Error ? err.message : "network error"}`,
      );
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch registry index from ${url}: ${response.status}`);
    }
    return response.json() as Promise<RegistryIndex>;
  }

  /** Fetch a single pack definition by name. */
  async fetchPack(name: string): Promise<RegistryItem> {
    const url = `${this.baseUrl}/api/registry/${name}.json`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new Error(
        `Cannot connect to registry at ${this.baseUrl}: ${err instanceof Error ? err.message : "network error"}`,
      );
    }
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Pack "${name}" not found in registry at ${this.baseUrl}`);
      }
      throw new Error(`Failed to fetch pack "${name}": ${response.status}`);
    }
    return response.json() as Promise<RegistryItem>;
  }

  /** Search packs by query string. */
  async search(query: string): Promise<RegistryIndex> {
    const url = `${this.baseUrl}/api/registry/search?q=${encodeURIComponent(query)}`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new Error(
        `Cannot connect to registry at ${this.baseUrl}: ${err instanceof Error ? err.message : "network error"}`,
      );
    }
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    return response.json() as Promise<RegistryIndex>;
  }
}

/** Create a client for a named registry from the config's registries map. */
export function createClient(
  registries: Record<string, string>,
  registryName: string,
): RegistryClient {
  const url = registries[registryName];
  if (!url) {
    throw new Error(
      `Unknown registry "${registryName}". Available: ${Object.keys(registries).join(", ")}`,
    );
  }
  return new RegistryClient(url);
}
