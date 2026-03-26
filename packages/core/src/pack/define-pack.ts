/**
 * Helper to define a pack inline with type safety.
 *
 * @example
 * ```typescript
 * const LoggingPack = definePack({
 *   meta: { name: "logging" },
 *   providers: [LoggingService],
 *   exports: [LoggingService],
 * });
 * ```
 */

import type { PackDefinition } from "./types.ts";

export function definePack(definition: PackDefinition): PackDefinition {
  return definition;
}
