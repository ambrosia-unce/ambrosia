import "reflect-metadata";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { EventBus } from "../event-bus.service.ts";
import type { HandlerEntry } from "../types.ts";

// Test event classes
class UserCreatedEvent {
  constructor(public readonly userId: string) {}
}

class OrderPlacedEvent {
  constructor(public readonly orderId: string) {}
}

class UnhandledEvent {}

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("emit", () => {
    it("calls registered handlers", () => {
      const handler = mock(() => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      const event = new UserCreatedEvent("user-1");
      bus.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does not error when no handlers registered", () => {
      bus.initialize(new Map(), new Set());
      expect(() => bus.emit(new UnhandledEvent())).not.toThrow();
    });

    it("returns undefined when no handlers registered", () => {
      bus.initialize(new Map(), new Set());
      const result = bus.emit(new UnhandledEvent());
      expect(result).toBeUndefined();
    });

    it("passes event instance to handler", () => {
      const handler = mock((_e: UserCreatedEvent) => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      const event = new UserCreatedEvent("user-42");
      bus.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("sync handlers return void (not a Promise)", () => {
      const handler = mock(() => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      const result = bus.emit(new UserCreatedEvent("user-1"));
      expect(result).toBeUndefined();
    });

    it("async handlers return a Promise", async () => {
      const handler = mock(async () => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      // Not in syncEvents since the handler is async
      bus.initialize(handlers, new Set());

      const result = bus.emit(new UserCreatedEvent("user-1"));
      expect(result).toBeInstanceOf(Promise);
      await result;
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("mixed sync/async handlers returns a Promise", async () => {
      const syncHandler = mock(() => {});
      const asyncHandler = mock(async () => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [
        { fn: syncHandler, priority: 1 },
        { fn: asyncHandler, priority: 0 },
      ]);
      bus.initialize(handlers, new Set());

      const result = bus.emit(new UserCreatedEvent("user-1"));
      expect(result).toBeInstanceOf(Promise);
      await result;
      expect(syncHandler).toHaveBeenCalledTimes(1);
      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });

    it("handler priority order — higher priority first", () => {
      const callOrder: number[] = [];
      const lowHandler = mock(() => { callOrder.push(1); });
      const highHandler = mock(() => { callOrder.push(2); });

      const handlers = new Map<Function, HandlerEntry[]>();
      // Pre-sorted by priority descending (as EventCollector would do)
      handlers.set(UserCreatedEvent, [
        { fn: highHandler, priority: 10 },
        { fn: lowHandler, priority: 0 },
      ]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      bus.emit(new UserCreatedEvent("user-1"));
      expect(callOrder).toEqual([2, 1]);
    });

    it("multiple handlers for same event are all called", () => {
      const handler1 = mock(() => {});
      const handler2 = mock(() => {});
      const handler3 = mock(() => {});

      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [
        { fn: handler1, priority: 0 },
        { fn: handler2, priority: 0 },
        { fn: handler3, priority: 0 },
      ]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      bus.emit(new UserCreatedEvent("user-1"));
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });

  describe("emitAsync", () => {
    it("calls handlers without returning a promise", () => {
      const handler = mock(() => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      bus.initialize(handlers, new Set([UserCreatedEvent]));

      const result = bus.emitAsync(new UserCreatedEvent("user-1"));
      expect(result).toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does not error when no handlers registered", () => {
      bus.initialize(new Map(), new Set());
      expect(() => bus.emitAsync(new UnhandledEvent())).not.toThrow();
    });

    it("calls async handlers but does not await them", () => {
      const handler = mock(async () => {});
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: handler, priority: 0 }]);
      bus.initialize(handlers, new Set());

      // emitAsync is fire-and-forget — returns void
      const result = bus.emitAsync(new UserCreatedEvent("user-1"));
      expect(result).toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("hasHandlers", () => {
    it("returns true when handlers exist", () => {
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: () => {}, priority: 0 }]);
      bus.initialize(handlers, new Set());

      expect(bus.hasHandlers(UserCreatedEvent)).toBe(true);
    });

    it("returns false when no handlers exist", () => {
      bus.initialize(new Map(), new Set());
      expect(bus.hasHandlers(UserCreatedEvent)).toBe(false);
    });

    it("returns false for empty handler array", () => {
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, []);
      bus.initialize(handlers, new Set());

      expect(bus.hasHandlers(UserCreatedEvent)).toBe(false);
    });
  });

  describe("getHandlerCount", () => {
    it("returns correct count", () => {
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [
        { fn: () => {}, priority: 0 },
        { fn: () => {}, priority: 1 },
        { fn: () => {}, priority: 2 },
      ]);
      bus.initialize(handlers, new Set());

      expect(bus.getHandlerCount(UserCreatedEvent)).toBe(3);
    });

    it("returns 0 for unregistered event", () => {
      bus.initialize(new Map(), new Set());
      expect(bus.getHandlerCount(UserCreatedEvent)).toBe(0);
    });
  });

  describe("getRegisteredEvents", () => {
    it("returns all registered event constructors", () => {
      const handlers = new Map<Function, HandlerEntry[]>();
      handlers.set(UserCreatedEvent, [{ fn: () => {}, priority: 0 }]);
      handlers.set(OrderPlacedEvent, [{ fn: () => {}, priority: 0 }]);
      bus.initialize(handlers, new Set());

      const events = bus.getRegisteredEvents();
      expect(events).toContain(UserCreatedEvent);
      expect(events).toContain(OrderPlacedEvent);
      expect(events.length).toBe(2);
    });
  });

  describe("initialize", () => {
    it("throws if called twice", () => {
      bus.initialize(new Map(), new Set());
      expect(() => bus.initialize(new Map(), new Set())).toThrow(
        /already initialized/,
      );
    });
  });
});
