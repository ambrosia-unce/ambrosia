import "reflect-metadata";
import { beforeEach, describe, expect, it } from "bun:test";
import { EventCollector } from "../event-collector.ts";
import { OnEvent } from "../decorators/on-event.decorator.ts";
import type { HandlerEntry } from "../types.ts";

// Test event classes
class UserCreatedEvent {
  constructor(public readonly userId: string) {}
}

class OrderPlacedEvent {
  constructor(public readonly orderId: string) {}
}

// Minimal mock container that satisfies IContainer.resolve()
function createMockContainer(instances: Map<Function, any>): any {
  return {
    resolve: (token: Function) => instances.get(token),
  };
}

describe("EventCollector", () => {
  let collector: EventCollector;

  beforeEach(() => {
    collector = new EventCollector();
  });

  it("collects handlers from providers with @OnEvent", () => {
    class Listener {
      @OnEvent(UserCreatedEvent)
      onUser(_event: UserCreatedEvent) {}
    }

    const instance = new Listener();
    const container = createMockContainer(new Map([[Listener, instance]]));

    const { handlers } = collector.collect(container, [Listener]);
    expect(handlers.has(UserCreatedEvent)).toBe(true);
    expect(handlers.get(UserCreatedEvent)!.length).toBe(1);
  });

  it("skips providers without @OnEvent", () => {
    class PlainService {
      doSomething() {}
    }

    const instance = new PlainService();
    const container = createMockContainer(new Map([[PlainService, instance]]));

    const { handlers } = collector.collect(container, [PlainService]);
    expect(handlers.size).toBe(0);
  });

  it("pre-binds handler functions", () => {
    class Listener {
      public called = false;

      @OnEvent(UserCreatedEvent)
      onUser(_event: UserCreatedEvent) {
        this.called = true;
      }
    }

    const instance = new Listener();
    const container = createMockContainer(new Map([[Listener, instance]]));

    const { handlers } = collector.collect(container, [Listener]);
    const entry = handlers.get(UserCreatedEvent)![0]!;

    // Call the pre-bound function without explicit `this` binding
    entry.fn(new UserCreatedEvent("test"));
    expect(instance.called).toBe(true);
  });

  it("sorts by priority descending", () => {
    class ListenerA {
      @OnEvent(UserCreatedEvent, { priority: 1 })
      onUser(_event: UserCreatedEvent) {}
    }

    class ListenerB {
      @OnEvent(UserCreatedEvent, { priority: 10 })
      onUser(_event: UserCreatedEvent) {}
    }

    class ListenerC {
      @OnEvent(UserCreatedEvent, { priority: 5 })
      onUser(_event: UserCreatedEvent) {}
    }

    const instanceA = new ListenerA();
    const instanceB = new ListenerB();
    const instanceC = new ListenerC();
    const container = createMockContainer(
      new Map<Function, any>([
        [ListenerA, instanceA],
        [ListenerB, instanceB],
        [ListenerC, instanceC],
      ]),
    );

    const { handlers } = collector.collect(container, [
      ListenerA,
      ListenerB,
      ListenerC,
    ]);
    const entries = handlers.get(UserCreatedEvent)!;

    expect(entries.length).toBe(3);
    // Priority descending: 10, 5, 1
    expect(entries[0]!.priority).toBe(10);
    expect(entries[1]!.priority).toBe(5);
    expect(entries[2]!.priority).toBe(1);
  });

  it("identifies sync events (all handlers sync)", () => {
    class SyncListener {
      @OnEvent(UserCreatedEvent)
      onUser(_event: UserCreatedEvent) {
        // sync handler
      }
    }

    const instance = new SyncListener();
    const container = createMockContainer(new Map([[SyncListener, instance]]));

    const { syncEvents } = collector.collect(container, [SyncListener]);
    expect(syncEvents.has(UserCreatedEvent)).toBe(true);
  });

  it("does not mark async events as sync", () => {
    class AsyncListener {
      @OnEvent(UserCreatedEvent)
      async onUser(_event: UserCreatedEvent) {
        // async handler
      }
    }

    const instance = new AsyncListener();
    const container = createMockContainer(new Map([[AsyncListener, instance]]));

    const { syncEvents } = collector.collect(container, [AsyncListener]);
    expect(syncEvents.has(UserCreatedEvent)).toBe(false);
  });

  it("mixed sync/async handlers marks event as not sync", () => {
    class SyncListener {
      @OnEvent(UserCreatedEvent)
      onUser(_event: UserCreatedEvent) {}
    }

    class AsyncListener {
      @OnEvent(UserCreatedEvent)
      async onUser(_event: UserCreatedEvent) {}
    }

    const syncInstance = new SyncListener();
    const asyncInstance = new AsyncListener();
    const container = createMockContainer(
      new Map<Function, any>([
        [SyncListener, syncInstance],
        [AsyncListener, asyncInstance],
      ]),
    );

    const { syncEvents } = collector.collect(container, [
      SyncListener,
      AsyncListener,
    ]);
    expect(syncEvents.has(UserCreatedEvent)).toBe(false);
  });

  it("handles multiple event types from same listener", () => {
    class MultiListener {
      @OnEvent(UserCreatedEvent)
      onUser(_event: UserCreatedEvent) {}

      @OnEvent(OrderPlacedEvent, { priority: 5 })
      onOrder(_event: OrderPlacedEvent) {}
    }

    const instance = new MultiListener();
    const container = createMockContainer(new Map([[MultiListener, instance]]));

    const { handlers } = collector.collect(container, [MultiListener]);
    expect(handlers.has(UserCreatedEvent)).toBe(true);
    expect(handlers.has(OrderPlacedEvent)).toBe(true);
    expect(handlers.get(UserCreatedEvent)!.length).toBe(1);
    expect(handlers.get(OrderPlacedEvent)!.length).toBe(1);
    expect(handlers.get(OrderPlacedEvent)![0]!.priority).toBe(5);
  });

  it("returns empty map for empty providers list", () => {
    const container = createMockContainer(new Map());
    const { handlers, syncEvents } = collector.collect(container, []);
    expect(handlers.size).toBe(0);
    expect(syncEvents.size).toBe(0);
  });
});
