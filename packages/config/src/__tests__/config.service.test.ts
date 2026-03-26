import { beforeEach, describe, expect, it } from "bun:test";
import { ConfigService } from "../config.service.ts";

describe("ConfigService", () => {
  let service: ConfigService;
  let values: Map<string, unknown>;

  beforeEach(() => {
    values = new Map<string, unknown>();
    values.set("port", 3000);
    values.set("debug", false);
    values.set("host", "localhost");
    values.set("tags", ["a", "b"]);
    // Construct ConfigService directly, bypassing DI decorator injection
    service = new ConfigService(values);
  });

  describe("get", () => {
    it("returns value by key", () => {
      expect(service.get<number>("port")).toBe(3000);
    });

    it("returns typed value", () => {
      expect(service.get<number>("port")).toBe(3000);
      expect(service.get<boolean>("debug")).toBe(false);
      expect(service.get<string>("host")).toBe("localhost");
    });

    it("returns array value", () => {
      expect(service.get<string[]>("tags")).toEqual(["a", "b"]);
    });

    it("returns undefined for missing key", () => {
      expect(service.get("nonexistent")).toBeUndefined();
    });
  });

  describe("getOrThrow", () => {
    it("returns value when key exists", () => {
      expect(service.getOrThrow<number>("port")).toBe(3000);
    });

    it("returns false-y values without throwing", () => {
      expect(service.getOrThrow<boolean>("debug")).toBe(false);
    });

    it("throws for missing key", () => {
      expect(() => service.getOrThrow("missing")).toThrow();
    });

    it("error message includes the missing key name", () => {
      expect(() => service.getOrThrow("missing")).toThrow(/missing/);
    });
  });

  describe("has", () => {
    it("returns true for existing key", () => {
      expect(service.has("port")).toBe(true);
    });

    it("returns false for missing key", () => {
      expect(service.has("nonexistent")).toBe(false);
    });
  });

  describe("getAll", () => {
    it("returns all config values as a plain object", () => {
      const all = service.getAll();
      expect(all).toEqual({
        port: 3000,
        debug: false,
        host: "localhost",
        tags: ["a", "b"],
      });
    });

    it("returns a frozen object", () => {
      const all = service.getAll();
      expect(Object.isFrozen(all)).toBe(true);
    });

    it("caches the snapshot on repeated calls", () => {
      const first = service.getAll();
      const second = service.getAll();
      expect(first).toBe(second); // same reference
    });

    it("frozen object is not mutable", () => {
      const all = service.getAll();
      expect(() => {
        (all as any).port = 9999;
      }).toThrow();
    });
  });
});
