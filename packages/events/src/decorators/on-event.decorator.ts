/**
 * @OnEvent() decorator
 *
 * Marks a method as an event handler for a specific event class.
 * The event class constructor is used as the key — no string names.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class EmailListener {
 *   @OnEvent(UserRegisteredEvent)
 *   async onUserRegistered(event: UserRegisteredEvent) {
 *     await this.mailer.send(event.user.email, 'welcome');
 *   }
 *
 *   @OnEvent(OrderPlacedEvent, { priority: 10 })
 *   onOrderPlaced(event: OrderPlacedEvent) {
 *     // sync handler — no async overhead
 *   }
 * }
 * ```
 */

import type { Constructor } from "@ambrosia-unce/core";
import { EVENTS_METADATA } from "../tokens.ts";
import type { EventHandlerMetadata, OnEventOptions } from "../types.ts";

/**
 * @OnEvent decorator — registers a method as an event handler.
 *
 * @param eventClass The event class to listen for (constructor used as key)
 * @param options Optional configuration (priority)
 */
export function OnEvent(
  eventClass: Constructor,
  options?: OnEventOptions,
): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    _descriptor: TypedPropertyDescriptor<any>,
  ): void => {
    const existing: EventHandlerMetadata[] =
      Reflect.getOwnMetadata(EVENTS_METADATA, target) || [];

    existing.push({
      eventClass,
      methodName: propertyKey as string,
      priority: options?.priority ?? 0,
    });

    Reflect.defineMetadata(EVENTS_METADATA, existing, target);
  };
}
