/**
 * Helper for creating async providers from AsyncPackOptions.
 *
 * @example
 * ```typescript
 * import { createAsyncProvider } from "@ambrosia/core";
 *
 * static forRootAsync(options: AsyncPackOptions<DbConfig>): PackDefinition {
 *   return {
 *     providers: [
 *       createAsyncProvider(DB_CONFIG, options),
 *       DatabaseService,
 *     ],
 *   };
 * }
 * ```
 */

import type { Token } from "../types/common.ts";
import type { FactoryProvider } from "../types/provider.ts";
import type { AsyncPackOptions } from "./types.ts";

export function createAsyncProvider<T>(
  token: Token<T>,
  options: AsyncPackOptions<T>,
): FactoryProvider<T> {
  return {
    token,
    useFactory: async (container) => {
      const deps: any[] = [];
      if (options.inject) {
        for (const t of options.inject) {
          deps.push(container.resolve(t));
        }
      }
      return options.useFactory(...deps);
    },
  };
}
