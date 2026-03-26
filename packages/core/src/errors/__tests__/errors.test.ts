import "reflect-metadata";
import { beforeEach, describe, expect, it } from "bun:test";
import { AmbrosiaError } from "../ambrosia-error.ts";
import {
  AMB001,
  AMB002,
  AMB003,
  AMB004,
  AMB005,
  AMB006,
  AMB007,
  AMB100,
  AMB101,
  AMB102,
  AMB103,
  AMB200,
  AMB201,
  AMB202,
  AMB203,
  AMB204,
  AMB300,
  AMB301,
  AMB302,
  AMB400,
  AMB401,
  createError,
  ERROR_CATALOG,
  type ErrorDefinition,
} from "../error-codes.ts";
import { formatAnyError, formatError } from "../error-formatter.ts";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Error System", () => {
  // ==================== AmbrosiaError ====================

  describe("AmbrosiaError", () => {
    it("should have correct code property", () => {
      const err = new AmbrosiaError("AMB001", "test message");
      expect(err.code).toBe("AMB001");
    });

    it("should have correct message", () => {
      const err = new AmbrosiaError("AMB002", "circular dep");
      expect(err.message).toBe("circular dep");
    });

    it("should have hint when provided", () => {
      const err = new AmbrosiaError("AMB003", "msg", "use @Injectable");
      expect(err.hint).toBe("use @Injectable");
    });

    it("should have undefined hint when not provided", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      expect(err.hint).toBeUndefined();
    });

    it("should have context when provided", () => {
      const ctx = { token: "UserService", pack: "AppPack" };
      const err = new AmbrosiaError("AMB001", "msg", "hint", ctx);
      expect(err.context).toEqual(ctx);
    });

    it("should have undefined context when not provided", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      expect(err.context).toBeUndefined();
    });

    it("should have name set to AmbrosiaError", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      expect(err.name).toBe("AmbrosiaError");
    });

    it("should be instanceof Error", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AmbrosiaError);
    });

    it("should generate correct docsUrl", () => {
      const err = new AmbrosiaError("AMB042", "msg");
      expect(err.docsUrl).toBe("https://ambrosia.dev/docs/core/errors/AMB042");
    });

    it("should have a stack trace", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain("AmbrosiaError");
    });
  });

  // ==================== createError ====================

  describe("createError", () => {
    it("should create error from definition without detail", () => {
      const err = createError(AMB001);
      expect(err).toBeInstanceOf(AmbrosiaError);
      expect(err.code).toBe("AMB001");
      expect(err.message).toBe(AMB001.message);
      expect(err.hint).toBe(AMB001.hint);
    });

    it("should append detail to message", () => {
      const err = createError(AMB001, "Token UserService not found");
      expect(err.message).toBe("Provider not found: Token UserService not found");
    });

    it("should include context when provided", () => {
      const ctx = { token: "Foo" };
      const err = createError(AMB001, "detail", ctx);
      expect(err.context).toEqual(ctx);
    });

    it("should preserve hint from definition", () => {
      const err = createError(AMB002, "A -> B -> A");
      expect(err.hint).toBe(AMB002.hint);
    });

    it("should work with all error definitions", () => {
      const allDefs: ErrorDefinition[] = [
        AMB001, AMB002, AMB003, AMB004, AMB005, AMB006, AMB007,
        AMB100, AMB101, AMB102, AMB103,
        AMB200, AMB201, AMB202, AMB203, AMB204,
        AMB300, AMB301, AMB302,
        AMB400, AMB401,
      ];

      for (const def of allDefs) {
        const err = createError(def);
        expect(err).toBeInstanceOf(AmbrosiaError);
        expect(err.code).toBe(def.code);
        expect(err.hint).toBe(def.hint);
      }
    });
  });

  // ==================== formatError ====================

  describe("formatError", () => {
    it("should produce a formatted string", () => {
      const err = new AmbrosiaError("AMB001", "Provider not found", "Add @Injectable()");
      const formatted = formatError(err);
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should include the error code in output", () => {
      const err = new AmbrosiaError("AMB007", "Missing export", "Add to exports");
      const formatted = formatError(err);
      expect(formatted).toContain("AMB007");
    });

    it("should include the error message in output", () => {
      const err = new AmbrosiaError("AMB001", "Provider not found");
      const formatted = formatError(err);
      expect(formatted).toContain("Provider not found");
    });

    it("should include hint when present", () => {
      const err = new AmbrosiaError("AMB001", "msg", "This is a helpful hint");
      const formatted = formatError(err);
      expect(formatted).toContain("Hint");
    });

    it("should include docs URL", () => {
      const err = new AmbrosiaError("AMB001", "msg");
      const formatted = formatError(err);
      expect(formatted).toContain("ambrosia.dev/docs/core/errors/AMB001");
    });

    it("should include context fields when present", () => {
      const err = new AmbrosiaError("AMB001", "msg", "hint", { token: "MyService" });
      const formatted = formatError(err);
      expect(formatted).toContain("Token");
      expect(formatted).toContain("MyService");
    });

    it("should respect NO_COLOR environment variable", () => {
      const originalNoColor = process.env.NO_COLOR;
      process.env.NO_COLOR = "1";

      try {
        const err = new AmbrosiaError("AMB001", "Provider not found", "hint");
        const formatted = formatError(err);
        // Should not contain ANSI escape codes
        expect(formatted).not.toContain("\x1b[");
      } finally {
        if (originalNoColor === undefined) {
          delete process.env.NO_COLOR;
        } else {
          process.env.NO_COLOR = originalNoColor;
        }
      }
    });
  });

  // ==================== formatAnyError ====================

  describe("formatAnyError", () => {
    it("should format AmbrosiaError with pretty output", () => {
      const err = createError(AMB001, "detail");
      const formatted = formatAnyError(err);
      expect(formatted).toContain("AMB001");
    });

    it("should format regular Error with its message", () => {
      const err = new Error("plain error");
      const formatted = formatAnyError(err);
      expect(formatted).toBe("plain error");
    });

    it("should format non-Error with String()", () => {
      const formatted = formatAnyError("just a string");
      expect(formatted).toBe("just a string");
    });

    it("should format number with String()", () => {
      const formatted = formatAnyError(42);
      expect(formatted).toBe("42");
    });
  });

  // ==================== ERROR_CATALOG ====================

  describe("ERROR_CATALOG", () => {
    it("should contain all DI error codes (AMB001-AMB007)", () => {
      expect(ERROR_CATALOG.AMB001).toBeDefined();
      expect(ERROR_CATALOG.AMB002).toBeDefined();
      expect(ERROR_CATALOG.AMB003).toBeDefined();
      expect(ERROR_CATALOG.AMB004).toBeDefined();
      expect(ERROR_CATALOG.AMB005).toBeDefined();
      expect(ERROR_CATALOG.AMB006).toBeDefined();
      expect(ERROR_CATALOG.AMB007).toBeDefined();
    });

    it("should contain all Pack error codes (AMB100-AMB103)", () => {
      expect(ERROR_CATALOG.AMB100).toBeDefined();
      expect(ERROR_CATALOG.AMB101).toBeDefined();
      expect(ERROR_CATALOG.AMB102).toBeDefined();
      expect(ERROR_CATALOG.AMB103).toBeDefined();
    });

    it("should contain all HTTP error codes (AMB200-AMB204)", () => {
      expect(ERROR_CATALOG.AMB200).toBeDefined();
      expect(ERROR_CATALOG.AMB201).toBeDefined();
      expect(ERROR_CATALOG.AMB202).toBeDefined();
      expect(ERROR_CATALOG.AMB203).toBeDefined();
      expect(ERROR_CATALOG.AMB204).toBeDefined();
    });

    it("should contain all Config error codes (AMB300-AMB302)", () => {
      expect(ERROR_CATALOG.AMB300).toBeDefined();
      expect(ERROR_CATALOG.AMB301).toBeDefined();
      expect(ERROR_CATALOG.AMB302).toBeDefined();
    });

    it("should contain all Event error codes (AMB400-AMB401)", () => {
      expect(ERROR_CATALOG.AMB400).toBeDefined();
      expect(ERROR_CATALOG.AMB401).toBeDefined();
    });

    it("every catalog entry should have code, message, and hint", () => {
      for (const [key, def] of Object.entries(ERROR_CATALOG)) {
        expect(def.code).toBe(key);
        expect(typeof def.message).toBe("string");
        expect(def.message.length).toBeGreaterThan(0);
        expect(typeof def.hint).toBe("string");
        expect(def.hint.length).toBeGreaterThan(0);
      }
    });

    it("should have unique error codes", () => {
      const codes = Object.values(ERROR_CATALOG).map((d) => d.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  // ==================== ErrorDefinition structure ====================

  describe("ErrorDefinition structure", () => {
    it("AMB001 should have correct fields", () => {
      expect(AMB001.code).toBe("AMB001");
      expect(AMB001.message).toBe("Provider not found");
      expect(AMB001.hint).toContain("@Injectable()");
    });

    it("AMB002 should describe circular dependency", () => {
      expect(AMB002.code).toBe("AMB002");
      expect(AMB002.message).toContain("Circular");
    });

    it("AMB100 should describe pack import cycle", () => {
      expect(AMB100.code).toBe("AMB100");
      expect(AMB100.message).toContain("Pack");
    });
  });
});
