/**
 * EventCollector — collects @OnEvent handler metadata from providers
 * and builds a pre-sorted Map<Constructor, HandlerEntry[]>.
 *
 * Called once during pack initialization. The resulting map is immutable
 * after construction — no runtime registration, no dynamic changes.
 */

import { type Constructor, type IContainer, Injectable } from "@ambrosia-unce/core";
import { EVENTS_METADATA } from "./tokens.ts";
import type { EventHandlerMetadata, HandlerEntry } from "./types.ts";

@Injectable()
export class EventCollector {
  /**
   * Collect all @OnEvent handlers from the given provider classes.
   *
   * Performance characteristics:
   * - Single pass over all providers
   * - Pre-binds handler functions (no allocation at emit time)
   * - Pre-sorts by priority descending (done ONCE, not at emit time)
   *
   * @param container DI container to resolve provider instances
   * @param providers List of provider constructors to scan
   * @returns Pre-built handler map and sync event set
   */
  collect(
    container: IContainer,
    providers: Constructor[],
  ): { handlers: Map<Function, HandlerEntry[]>; syncEvents: Set<Function> } {
    const map = new Map<Function, HandlerEntry[]>();

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]!;
      const metadata: EventHandlerMetadata[] | undefined =
        Reflect.getOwnMetadata(EVENTS_METADATA, provider.prototype);

      if (!metadata || metadata.length === 0) continue;

      const instance = container.resolve(provider);

      for (let j = 0; j < metadata.length; j++) {
        const entry = metadata[j]!;
        let handlers = map.get(entry.eventClass);
        if (!handlers) {
          handlers = [];
          map.set(entry.eventClass, handlers);
        }
        handlers.push({
          fn: (instance as any)[entry.methodName].bind(instance),
          priority: entry.priority,
        });
      }
    }

    // Pre-sort by priority (descending) — done ONCE at build time
    for (const handlers of map.values()) {
      if (handlers.length > 1) {
        handlers.sort((a, b) => b.priority - a.priority);
      }
    }

    // Determine which events have ALL sync handlers
    const syncEvents = new Set<Function>();
    for (const [eventClass, handlers] of map) {
      let allSync = true;
      for (let i = 0; i < handlers.length; i++) {
        // Check if the handler function is async by examining its constructor name
        if (handlers[i]!.fn.constructor.name === "AsyncFunction") {
          allSync = false;
          break;
        }
      }
      if (allSync) {
        syncEvents.add(eventClass);
      }
    }

    return { handlers: map, syncEvents };
  }
}
