/**
 * DevToolsEventCollector — collects event handler metadata
 * and maintains a live event log for DevTools.
 *
 * If @ambrosia-unce/events is installed, this collector reads
 * handler metadata from the EventBus. Otherwise it returns
 * empty data gracefully.
 */

import { Injectable, type Container } from "@ambrosia-unce/core";
import type { EventHandlerInfo, EventInfo, EventLogEntry, EventMapData } from "../types.ts";

/** Maximum number of recent events to keep in the log. */
const MAX_EVENT_LOG = 100;

@Injectable()
export class DevToolsEventCollector {
  private recentEvents: EventLogEntry[] = [];

  /**
   * Collect event handler metadata from the EventBus (if available).
   */
  collectEvents(container: Container): EventMapData {
    const events: EventInfo[] = [];
    let totalHandlers = 0;

    try {
      // Try to resolve EventBus — it may not be registered if
      // @ambrosia-unce/events is not used in the application.
      const eventBus = container.resolveOptional<any>(
        this.getEventBusToken(),
      );

      if (eventBus && typeof eventBus.getRegisteredEvents === "function") {
        const registeredEvents: Function[] = eventBus.getRegisteredEvents();

        for (const eventClass of registeredEvents) {
          const handlerCount = eventBus.getHandlerCount(eventClass);
          const handlers: EventHandlerInfo[] = [];

          // EventBus doesn't expose handler details directly,
          // so we report the count with the event class name.
          for (let i = 0; i < handlerCount; i++) {
            handlers.push({
              class: "unknown",
              method: "unknown",
              priority: 0,
            });
          }

          totalHandlers += handlerCount;
          events.push({
            eventName: eventClass.name || "AnonymousEvent",
            handlers,
          });
        }
      }
    } catch {
      // EventBus not available — return empty data
    }

    return {
      events,
      totalEvents: events.length,
      totalHandlers,
    };
  }

  /**
   * Log a live event (kept in a circular buffer of MAX_EVENT_LOG).
   */
  logEvent(event: EventLogEntry): void {
    this.recentEvents.push(event);
    if (this.recentEvents.length > MAX_EVENT_LOG) {
      this.recentEvents.shift();
    }
  }

  /**
   * Get the most recent events from the log.
   */
  getRecentEvents(): EventLogEntry[] {
    return this.recentEvents;
  }

  /**
   * Clear the event log.
   */
  clearLog(): void {
    this.recentEvents = [];
  }

  /**
   * Try to get the EventBus class for resolution.
   * Uses dynamic import attempt to avoid hard dependency.
   */
  private getEventBusToken(): any {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const events = require("@ambrosia-unce/events");
      return events.EventBus;
    } catch {
      return class EventBusPlaceholder {};
    }
  }
}
