/**
 * Type definitions for @ambrosia/events
 */

import type { Constructor } from "@ambrosia/core";

/**
 * Event handler entry — pre-bound function with priority.
 * Stored in the handler map, sorted by priority at build time.
 */
export interface HandlerEntry {
  /** Pre-bound handler function — no allocation at emit time */
  fn: (event: any) => any;
  /** Priority (higher = executed first). Default: 0 */
  priority: number;
}

/**
 * Metadata stored by @OnEvent decorator on a class prototype.
 */
export interface EventHandlerMetadata {
  /** Event class constructor — used as Map key */
  eventClass: Constructor;
  /** Method name on the listener class */
  methodName: string;
  /** Execution priority (higher = first). Default: 0 */
  priority: number;
}

/**
 * Options for @OnEvent decorator.
 */
export interface OnEventOptions {
  /**
   * Handler priority. Higher values execute first.
   * Handlers with the same priority execute in registration order.
   * @default 0
   */
  priority?: number;
}

/**
 * Options for EventBusModule.forRoot().
 */
export interface EventBusModuleOptions {
  /**
   * If true, EventBus is exported globally (available to all packs).
   * @default true
   */
  global?: boolean;
}
