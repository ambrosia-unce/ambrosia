/**
 * EventBus — the core emit/on engine.
 *
 * PERFORMANCE CRITICAL:
 * - Pre-built Map<Constructor, HandlerEntry[]> — NO runtime registration
 * - emit() = Map.get(event.constructor) + direct loop. O(1) lookup + O(n) handlers
 * - Constructor-based keys (faster than string hashing)
 * - Sync path: if ALL handlers are sync, skip Promise.all overhead entirely
 * - Handlers pre-sorted by priority at build time
 * - Minimal allocations: reuse arrays, avoid spreading
 */

import { Injectable } from "@ambrosia-unce/core";
import type { HandlerEntry } from "./types.ts";

@Injectable()
export class EventBus {
  /**
   * Pre-built handler map. Set once during initialization, never modified after.
   * Key: event class constructor
   * Value: handlers sorted by priority (descending)
   */
  private handlers: Map<Function, HandlerEntry[]> = new Map();

  /**
   * Set of event constructors where ALL handlers are sync.
   * Used to skip Promise.all overhead on the fast path.
   */
  private syncEvents: Set<Function> = new Set();

  /**
   * Whether the bus has been initialized.
   */
  private initialized = false;

  /**
   * Initialize the event bus with pre-built handler map.
   * Called once by EventBusModule during pack onInit.
   * After initialization, the handler map is immutable.
   */
  initialize(
    handlers: Map<Function, HandlerEntry[]>,
    syncEvents: Set<Function>,
  ): void {
    if (this.initialized) {
      throw new Error("EventBus is already initialized. Cannot re-initialize.");
    }
    this.handlers = handlers;
    this.syncEvents = syncEvents;
    this.initialized = true;
  }

  /**
   * Emit an event to all registered handlers.
   *
   * Performance:
   * - O(1) lookup via Map.get(constructor)
   * - Direct for-loop (no iterator overhead)
   * - Sync fast path: if all handlers are sync, returns void (no Promise)
   * - Async path: only creates Promise[] when needed
   *
   * @param event The event instance to emit
   * @returns void if all handlers are sync, Promise<void> if any handler is async
   */
  emit<T extends object>(event: T): Promise<void> | void {
    const ctor = event.constructor;
    const entries = this.handlers.get(ctor);
    if (!entries) return; // No handlers — zero cost

    // Fast path: all handlers are sync
    if (this.syncEvents.has(ctor)) {
      for (let i = 0; i < entries.length; i++) {
        entries[i]!.fn(event);
      }
      return;
    }

    // Async path: collect promises only from async handlers
    const promises: Promise<void>[] = [];
    for (let i = 0; i < entries.length; i++) {
      const result = entries[i]!.fn(event);
      if (result && typeof result.then === "function") {
        promises.push(result as Promise<void>);
      }
    }

    return promises.length > 0
      ? Promise.all(promises).then(noop)
      : undefined;
  }

  /**
   * Fire and forget — calls all handlers but does NOT await async ones.
   * Use when you don't care about handler completion.
   *
   * @param event The event instance to emit
   */
  emitAsync<T extends object>(event: T): void {
    const ctor = event.constructor;
    const entries = this.handlers.get(ctor);
    if (!entries) return;

    for (let i = 0; i < entries.length; i++) {
      entries[i]!.fn(event);
    }
  }

  /**
   * Check if any handlers are registered for an event class.
   *
   * @param eventClass The event class constructor
   * @returns true if at least one handler is registered
   */
  hasHandlers(eventClass: Function): boolean {
    const entries = this.handlers.get(eventClass);
    return entries !== undefined && entries.length > 0;
  }

  /**
   * Get the number of handlers registered for an event class.
   *
   * @param eventClass The event class constructor
   * @returns Number of registered handlers
   */
  getHandlerCount(eventClass: Function): number {
    return this.handlers.get(eventClass)?.length ?? 0;
  }

  /**
   * Get all event classes that have registered handlers.
   */
  getRegisteredEvents(): Function[] {
    return Array.from(this.handlers.keys());
  }
}

/** Reusable no-op for Promise.all().then() — avoids creating a new function per emit */
function noop(): void {}
