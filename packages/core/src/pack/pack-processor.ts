/**
 * PackProcessor — recursively processes PackDefinitions.
 *
 * Features:
 * - Depth-first import processing with deduplication
 * - Dynamic packs (falsy filtering)
 * - Lazy imports for circular dependency breaking
 * - Circular import detection with warnings
 * - Export tracking (encapsulation)
 * - Lifecycle hook registration
 * - Pack registry integration
 */

import type { Container } from "../container/container.ts";
import { AMB100, createError } from "../errors/error-codes.ts";
import { DEFAULT_SCOPE } from "../scope/types.ts";
import type { Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";
import { globalLogger } from "../utils/logger.ts";
import { PackLifecycleManager } from "./pack-lifecycle.ts";
import { packRegistry } from "./pack-registry.ts";
import { isConstructorProvider, type Packable, type PackDefinition } from "./types.ts";

export interface PackProcessingResult {
  providers: Provider[];
  exportedTokens: Set<Token>;
}

export class PackProcessor {
  private processedPacks = new Set<PackDefinition>();
  private importChain: PackDefinition[] = [];
  private exportedTokens = new Set<Token>();
  private lifecycleManager = new PackLifecycleManager();

  process(packs: Packable[]): PackProcessingResult {
    const providers: Provider[] = [];

    for (const pack of packs) {
      if (!pack) continue;
      this.processSingle(pack, providers);
    }

    return { providers, exportedTokens: this.exportedTokens };
  }

  getLifecycleManager(): PackLifecycleManager {
    return this.lifecycleManager;
  }

  private processSingle(pack: PackDefinition, providers: Provider[]): void {
    // Circular import detection
    if (this.importChain.includes(pack)) {
      const chain = this.importChain.map((p) => p.meta?.name || "anonymous").join(" \u2192 ");
      const current = pack.meta?.name || "anonymous";
      const error = createError(
        AMB100,
        `${chain} \u2192 ${current}`,
        { chain, current },
      );
      globalLogger.warn(error.message);
    }

    // Deduplication
    if (this.processedPacks.has(pack)) return;
    this.processedPacks.add(pack);

    // Register in pack registry
    const packName = packRegistry.register(pack);

    // Register lifecycle hooks
    this.lifecycleManager.register(pack, packName);

    // Track import chain
    this.importChain.push(pack);

    // Process imports first (depth-first)
    if (pack.imports) {
      for (const imported of pack.imports) {
        if (imported) this.processSingle(imported, providers);
      }
    }

    // Process lazy imports
    if (pack.lazyImports) {
      const lazy = pack.lazyImports();
      for (const imported of lazy) {
        if (imported) this.processSingle(imported, providers);
      }
    }

    // Pop from import chain
    this.importChain.pop();

    // Normalize and collect providers, track tokens for exports
    const packTokenSet = new Set<Token>();

    if (pack.providers) {
      for (const item of pack.providers) {
        if (isConstructorProvider(item)) {
          providers.push({
            token: item,
            useClass: item,
            scope: DEFAULT_SCOPE,
          });
          packTokenSet.add(item);
        } else {
          providers.push(item);
          packTokenSet.add(item.token);
        }
      }
    }

    // Track exported tokens
    if (pack.exports) {
      for (const token of pack.exports) {
        if (!packTokenSet.has(token)) {
          globalLogger.warn(
            `Pack "${packName}" exports "${String(token)}" but does not provide it. Skipping export.`,
          );
          continue;
        }
        this.exportedTokens.add(token);
      }
    } else {
      // No exports = export all (backward compatible)
      for (const token of packTokenSet) {
        this.exportedTokens.add(token);
      }
    }
  }

  /**
   * Register processed providers into a Container.
   * Optionally sets exported tokens for export enforcement.
   */
  static registerInContainer(
    container: Container,
    providers: Provider[],
    exportedTokens?: Set<Token>,
  ): void {
    for (const provider of providers) {
      if (!container.has(provider.token)) {
        container.register(provider);
      }
    }
    if (exportedTokens) {
      container.setExportedTokens(exportedTokens);
    }
  }
}
