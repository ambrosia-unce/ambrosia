import "reflect-metadata";
import { describe, expect, it } from "bun:test";
import { OnEvent } from "../decorators/on-event.decorator.ts";
import { EVENTS_METADATA } from "../tokens.ts";
import type { EventHandlerMetadata } from "../types.ts";

// Test event classes
class UserCreatedEvent {
  constructor(public readonly userId: string) {}
}

class OrderPlacedEvent {
  constructor(public readonly orderId: string) {}
}

describe("@OnEvent decorator", () => {
  it("stores metadata on class prototype", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent)
      onUserCreated(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata).toBeDefined();
    expect(metadata.length).toBe(1);
  });

  it("stores event class reference", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent)
      onUserCreated(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata[0]!.eventClass).toBe(UserCreatedEvent);
  });

  it("stores method name", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent)
      handleUser(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata[0]!.methodName).toBe("handleUser");
  });

  it("default priority is 0", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent)
      onUserCreated(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata[0]!.priority).toBe(0);
  });

  it("custom priority is stored", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent, { priority: 10 })
      onUserCreated(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata[0]!.priority).toBe(10);
  });

  it("supports negative priority", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent, { priority: -5 })
      onUserCreated(_event: UserCreatedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata[0]!.priority).toBe(-5);
  });

  it("multiple handlers on same class", () => {
    class TestListener {
      @OnEvent(UserCreatedEvent)
      onUserCreated(_event: UserCreatedEvent) {}

      @OnEvent(OrderPlacedEvent, { priority: 5 })
      onOrderPlaced(_event: OrderPlacedEvent) {}
    }

    const metadata: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      TestListener.prototype,
    );
    expect(metadata.length).toBe(2);

    const userHandler = metadata.find((m) => m.eventClass === UserCreatedEvent);
    const orderHandler = metadata.find((m) => m.eventClass === OrderPlacedEvent);

    expect(userHandler).toBeDefined();
    expect(userHandler!.methodName).toBe("onUserCreated");
    expect(userHandler!.priority).toBe(0);

    expect(orderHandler).toBeDefined();
    expect(orderHandler!.methodName).toBe("onOrderPlaced");
    expect(orderHandler!.priority).toBe(5);
  });

  it("does not share metadata between different classes", () => {
    class ListenerA {
      @OnEvent(UserCreatedEvent)
      handle(_event: UserCreatedEvent) {}
    }

    class ListenerB {
      @OnEvent(OrderPlacedEvent)
      handle(_event: OrderPlacedEvent) {}
    }

    const metaA: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      ListenerA.prototype,
    );
    const metaB: EventHandlerMetadata[] = Reflect.getOwnMetadata(
      EVENTS_METADATA,
      ListenerB.prototype,
    );

    expect(metaA.length).toBe(1);
    expect(metaA[0]!.eventClass).toBe(UserCreatedEvent);

    expect(metaB.length).toBe(1);
    expect(metaB[0]!.eventClass).toBe(OrderPlacedEvent);
  });
});
