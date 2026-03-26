/**
 * EventBusModule — PackDefinition factory for the event bus system.
 *
 * Usage:
 * ```typescript
 * import { EventBusModule } from '@ambrosia-unce/events';
 *
 * const AppPack = definePack({
 *   imports: [EventBusModule.forRoot()],
 *   providers: [EmailListener, OrderListener],
 * });
 * ```
 *
 * The module:
 * 1. Registers EventBus and EventCollector as providers
 * 2. In onInit lifecycle, collects all @OnEvent handlers from the container
 * 3. Injects the pre-built handler map into EventBus
 * 4. Exports EventBus for injection into other services
 */

import { type Constructor, type PackDefinition, definePack } from "@ambrosia-unce/core";
import { EventBus } from "./event-bus.service.ts";
import { EventCollector } from "./event-collector.ts";
import { EVENTS_METADATA } from "./tokens.ts";
import type { EventBusModuleOptions } from "./types.ts";

export class EventBusModule {
  /**
   * Create the EventBus pack definition.
   *
   * @param options Configuration options
   * @returns PackDefinition to be used in imports
   */
  static forRoot(options?: EventBusModuleOptions): PackDefinition {
    const { global: isGlobal = true } = options ?? {};

    return definePack({
      meta: {
        name: "@ambrosia-unce/events",
        version: "0.1.0",
        description: "High-performance event bus",
      },
      providers: [EventBus, EventCollector],
      exports: isGlobal ? [EventBus] : [EventBus, EventCollector],

      onInit: (container) => {
        const collector = container.resolve(EventCollector);
        const bus = container.resolve(EventBus);

        // Scan ALL registered tokens in the container for @OnEvent metadata.
        // This covers providers from all imported packs since onInit runs
        // after all pack providers are registered.
        const allTokens = container.getTokens();
        const providers: Constructor[] = [];

        for (let i = 0; i < allTokens.length; i++) {
          const token = allTokens[i]!;
          // Only scan constructors (classes), skip InjectionTokens and abstract classes
          if (typeof token === "function" && token.prototype) {
            // Quick check: does this class have @OnEvent metadata?
            if (Reflect.getOwnMetadata(EVENTS_METADATA, token.prototype)) {
              providers.push(token as Constructor);
            }
          }
        }

        const { handlers, syncEvents } = collector.collect(container, providers);
        bus.initialize(handlers, syncEvents);
      },
    });
  }
}
