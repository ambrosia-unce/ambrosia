/**
 * ConfigService — the main API for accessing parsed config values.
 *
 * Internal store is a Map<string, unknown> built once at init, then frozen.
 * All lookups are O(1) via Map.get with zero runtime overhead.
 */

import { Inject, Injectable } from "@ambrosia-unce/core";
import { CONFIG_VALUES } from "./tokens.ts";

@Injectable()
export class ConfigService {
  /** Internal frozen store — built once, never mutated */
  private readonly store: Map<string, unknown>;

  /** Frozen plain object snapshot — cached on first access */
  private snapshot: Readonly<Record<string, unknown>> | null = null;

  constructor(
    @Inject(CONFIG_VALUES) values: Map<string, unknown>,
  ) {
    this.store = values;
  }

  /**
   * Get a config value by key. Returns undefined if not found.
   * O(1) lookup via Map.get.
   *
   * @param key - The config key to look up
   * @returns The parsed value or undefined
   *
   * @example
   * ```ts
   * const port = config.get<number>('port'); // 3000
   * const debug = config.get<boolean>('debug'); // false
   * ```
   */
  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /**
   * Get a config value by key. Throws if not found.
   * O(1) lookup via Map.get.
   *
   * @param key - The config key to look up
   * @returns The parsed value
   * @throws Error if the key is not found in config
   *
   * @example
   * ```ts
   * const secret = config.getOrThrow<string>('secret'); // throws if missing
   * ```
   */
  getOrThrow<T = unknown>(key: string): T {
    const value = this.store.get(key);
    if (value === undefined) {
      throw new Error(
        `[Config] Key "${key}" not found in config. ` +
          "Make sure it is defined in your config schema and the environment variable is set.",
      );
    }
    return value as T;
  }

  /**
   * Check if a config key exists.
   *
   * @param key - The config key to check
   * @returns true if the key exists
   */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Get all config values as a frozen plain object.
   * The object is cached after first access.
   *
   * @returns A frozen record of all config key-value pairs
   */
  getAll(): Readonly<Record<string, unknown>> {
    if (this.snapshot === null) {
      const obj: Record<string, unknown> = {};
      for (const [key, value] of this.store) {
        obj[key] = value;
      }
      this.snapshot = Object.freeze(obj);
    }
    return this.snapshot;
  }
}
