/**
 * SseStream tests — serialization safety, close handling
 */

import { describe, expect, test } from "bun:test";
import { SseStream } from "../../../src/sse/sse-stream.ts";

describe("SseStream", () => {
  test("sends basic string data", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: "hello" });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toBe("data: hello\n\n");

    sse.close();
    reader.releaseLock();
  });

  test("sends JSON data", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: { count: 42 } });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toBe('data: {"count":42}\n\n');

    sse.close();
    reader.releaseLock();
  });

  test("sends event with id and event type", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: "payload", id: "1", event: "update" });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("id: 1\n");
    expect(text).toContain("event: update\n");
    expect(text).toContain("data: payload\n\n");

    sse.close();
    reader.releaseLock();
  });

  test("sends retry field", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: "x", retry: 3000 });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("retry: 3000\n");

    sse.close();
    reader.releaseLock();
  });

  test("handles null data gracefully", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: null as any });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    // null is not an object (typeof null === "object" but we check !== null)
    // Falls to String(null ?? "") = ""
    expect(text).toBe("data: \n\n");

    sse.close();
    reader.releaseLock();
  });

  test("handles undefined data gracefully", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    sse.send({ data: undefined as any });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toBe("data: \n\n");

    sse.close();
    reader.releaseLock();
  });

  test("handles circular reference without crashing", async () => {
    const sse = new SseStream();
    const reader = sse.stream.getReader();

    const circular: any = { a: 1 };
    circular.self = circular; // circular reference

    sse.send({ data: circular });

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    // Should send error event instead of crashing
    expect(text).toContain("event: error");
    expect(text).toContain("Failed to serialize");

    sse.close();
    reader.releaseLock();
  });

  test("does not send after close", async () => {
    const sse = new SseStream();
    sse.close();

    // send after close should be a no-op, not throw
    expect(() => sse.send({ data: "after-close" })).not.toThrow();
  });

  test("onClose callbacks fire on close()", () => {
    const sse = new SseStream();
    let called = false;
    sse.onClose(() => {
      called = true;
    });

    sse.close();
    expect(called).toBe(true);
  });

  test("onClose callbacks fire on stream cancel", async () => {
    const sse = new SseStream();
    let called = false;
    sse.onClose(() => {
      called = true;
    });

    // Cancel the stream (simulates client disconnect)
    await sse.stream.cancel();
    expect(called).toBe(true);
  });
});
