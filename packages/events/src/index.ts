/**
 * @ambrosia/events — High-performance event bus for Ambrosia DI framework
 *
 * @example
 * ```typescript
 * import { EventBus, EventBusModule, OnEvent } from '@ambrosia/events';
 * import { Injectable, definePack } from '@ambrosia/core';
 *
 * // 1. Define event classes
 * class UserRegisteredEvent {
 *   constructor(public readonly userId: string) {}
 * }
 *
 * // 2. Create listeners with @OnEvent
 * @Injectable()
 * class EmailListener {
 *   @OnEvent(UserRegisteredEvent)
 *   async onUserRegistered(event: UserRegisteredEvent) {
 *     console.log('Send welcome email to', event.userId);
 *   }
 * }
 *
 * // 3. Import EventBusModule and emit events
 * const AppPack = definePack({
 *   imports: [EventBusModule.forRoot()],
 *   providers: [EmailListener],
 * });
 * ```
 *
 * @module @ambrosia/events
 */

import "reflect-metadata";

export { EventBus } from "./event-bus.service.ts";
export { EventBusModule } from "./event-bus.module.ts";
export { EventCollector } from "./event-collector.ts";
export { OnEvent } from "./decorators/on-event.decorator.ts";
export { EVENTS_METADATA } from "./tokens.ts";
export type {
  EventBusModuleOptions,
  EventHandlerMetadata,
  HandlerEntry,
  OnEventOptions,
} from "./types.ts";
