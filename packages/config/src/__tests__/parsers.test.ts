import { describe, expect, it } from "bun:test";
import { ConfigParseError, parseValue } from "../parsers.ts";

describe("parseValue", () => {
  describe("string parser", () => {
    it("returns the value as-is", () => {
      expect(parseValue("hello", "string", "key")).toBe("hello");
    });

    it("preserves whitespace", () => {
      expect(parseValue("  hello  ", "string", "key")).toBe("  hello  ");
    });

    it("handles empty string", () => {
      expect(parseValue("", "string", "key")).toBe("");
    });
  });

  describe("int parser", () => {
    it('parses "3000" to 3000', () => {
      expect(parseValue("3000", "int", "port")).toBe(3000);
    });

    it("parses negative integers", () => {
      expect(parseValue("-42", "int", "offset")).toBe(-42);
    });

    it("parses zero", () => {
      expect(parseValue("0", "int", "count")).toBe(0);
    });

    it('throws ConfigParseError for "abc"', () => {
      expect(() => parseValue("abc", "int", "port")).toThrow(ConfigParseError);
    });

    it("throws ConfigParseError for empty string", () => {
      expect(() => parseValue("", "int", "port")).toThrow(ConfigParseError);
    });

    it("error includes key and raw value", () => {
      try {
        parseValue("abc", "int", "port");
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigParseError);
        const e = err as ConfigParseError;
        expect(e.key).toBe("port");
        expect(e.rawValue).toBe("abc");
        expect(e.expectedType).toBe("int");
      }
    });
  });

  describe("float parser", () => {
    it('parses "1.5" to 1.5', () => {
      expect(parseValue("1.5", "float", "rate")).toBe(1.5);
    });

    it("parses integer strings as floats", () => {
      expect(parseValue("42", "float", "rate")).toBe(42);
    });

    it("parses negative floats", () => {
      expect(parseValue("-3.14", "float", "offset")).toBe(-3.14);
    });

    it('throws ConfigParseError for "abc"', () => {
      expect(() => parseValue("abc", "float", "rate")).toThrow(ConfigParseError);
    });

    it("error includes key and raw value", () => {
      try {
        parseValue("abc", "float", "rate");
      } catch (err) {
        const e = err as ConfigParseError;
        expect(e.key).toBe("rate");
        expect(e.rawValue).toBe("abc");
        expect(e.expectedType).toBe("float");
      }
    });
  });

  describe("bool parser", () => {
    it('parses "true" to true', () => {
      expect(parseValue("true", "bool", "debug")).toBe(true);
    });

    it('parses "1" to true', () => {
      expect(parseValue("1", "bool", "debug")).toBe(true);
    });

    it('parses "yes" to true', () => {
      expect(parseValue("yes", "bool", "debug")).toBe(true);
    });

    it("is case-insensitive for truthy values", () => {
      expect(parseValue("TRUE", "bool", "debug")).toBe(true);
      expect(parseValue("Yes", "bool", "debug")).toBe(true);
    });

    it('parses "false" to false', () => {
      expect(parseValue("false", "bool", "debug")).toBe(false);
    });

    it('parses "0" to false', () => {
      expect(parseValue("0", "bool", "debug")).toBe(false);
    });

    it('parses "no" to false', () => {
      expect(parseValue("no", "bool", "debug")).toBe(false);
    });

    it("parses any other string to false", () => {
      expect(parseValue("anything", "bool", "debug")).toBe(false);
      expect(parseValue("", "bool", "debug")).toBe(false);
    });
  });

  describe("array parser", () => {
    it('parses "a,b,c" to ["a","b","c"]', () => {
      expect(parseValue("a,b,c", "array", "hosts")).toEqual(["a", "b", "c"]);
    });

    it("trims whitespace from elements", () => {
      expect(parseValue("a , b , c", "array", "hosts")).toEqual(["a", "b", "c"]);
    });

    it("uses custom separator", () => {
      expect(parseValue("a;b;c", "array", "hosts", ";")).toEqual(["a", "b", "c"]);
    });

    it("handles single element", () => {
      expect(parseValue("only", "array", "hosts")).toEqual(["only"]);
    });

    it("handles empty string (single empty element)", () => {
      expect(parseValue("", "array", "hosts")).toEqual([""]);
    });
  });

  describe("json parser", () => {
    it("parses valid JSON object", () => {
      expect(parseValue('{"a":1,"b":"two"}', "json", "config")).toEqual({
        a: 1,
        b: "two",
      });
    });

    it("parses valid JSON array", () => {
      expect(parseValue("[1,2,3]", "json", "list")).toEqual([1, 2, 3]);
    });

    it("parses JSON primitives", () => {
      expect(parseValue("42", "json", "num")).toBe(42);
      expect(parseValue('"hello"', "json", "str")).toBe("hello");
      expect(parseValue("true", "json", "flag")).toBe(true);
      expect(parseValue("null", "json", "empty")).toBeNull();
    });

    it("throws ConfigParseError for invalid JSON", () => {
      expect(() => parseValue("{invalid}", "json", "config")).toThrow(ConfigParseError);
    });

    it("error includes key and raw value for invalid JSON", () => {
      try {
        parseValue("{bad", "json", "config");
      } catch (err) {
        const e = err as ConfigParseError;
        expect(e.key).toBe("config");
        expect(e.rawValue).toBe("{bad");
        expect(e.expectedType).toBe("json");
      }
    });
  });

  describe("default/unknown type", () => {
    it("falls back to string parser for unknown type", () => {
      // Cast to bypass type checking for edge case
      expect(parseValue("hello", "unknown" as any, "key")).toBe("hello");
    });
  });
});

describe("ConfigParseError", () => {
  it("has correct name", () => {
    const err = new ConfigParseError("port", "abc", "int", "not valid");
    expect(err.name).toBe("ConfigParseError");
  });

  it("includes key, rawValue, expectedType in message", () => {
    const err = new ConfigParseError("port", "abc", "int", "not valid");
    expect(err.message).toContain("port");
    expect(err.message).toContain("abc");
    expect(err.message).toContain("int");
  });
});
