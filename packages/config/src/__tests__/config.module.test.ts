import { beforeEach, describe, expect, it } from "bun:test";
import { defineConfig, ConfigModule } from "../config.module.ts";
import { ConfigService } from "../config.service.ts";
import { CONFIG_SCHEMA, CONFIG_VALUES } from "../tokens.ts";
import type { ConfigSchema } from "../types.ts";

describe("defineConfig", () => {
  it("returns the same schema object (identity)", () => {
    const schema = {
      port: { env: "PORT", type: "int" as const, default: 3000 },
    };
    const result = defineConfig(schema);
    expect(result).toBe(schema);
  });

  it("preserves all schema entries", () => {
    const schema = defineConfig({
      port: { env: "PORT", type: "int", default: 3000 },
      debug: { env: "DEBUG", type: "bool", default: false },
      host: { env: "HOST", default: "localhost" },
    });
    expect(Object.keys(schema)).toEqual(["port", "debug", "host"]);
    expect(schema.port.env).toBe("PORT");
    expect(schema.debug.type).toBe("bool");
  });
});

describe("ConfigModule.forRoot", () => {
  // Save and restore env so tests don't leak state
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Clear test env vars before each test
    for (const key of ["PORT", "DEBUG", "HOST", "DB_HOSTS", "REDIS_CONFIG", "JWT_SECRET", "RATE"]) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  // Restore after each test
  function restoreEnv() {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  it("parses env values correctly with int type", () => {
    process.env.PORT = "8080";
    const schema = defineConfig({
      port: { env: "PORT", type: "int" },
    });
    const pack = ConfigModule.forRoot({ schema, validate: false });
    // Extract the CONFIG_VALUES provider to check parsed values
    const valuesProvider = pack.providers!.find(
      (p: any) => p.token === CONFIG_VALUES,
    ) as any;
    expect(valuesProvider).toBeDefined();
    const map = valuesProvider.useValue as Map<string, unknown>;
    expect(map.get("port")).toBe(8080);
    restoreEnv();
  });

  it("parses bool type", () => {
    process.env.DEBUG = "true";
    const schema = defineConfig({
      debug: { env: "DEBUG", type: "bool" },
    });
    const pack = ConfigModule.forRoot({ schema, validate: false });
    const valuesProvider = pack.providers!.find(
      (p: any) => p.token === CONFIG_VALUES,
    ) as any;
    const map = valuesProvider.useValue as Map<string, unknown>;
    expect(map.get("debug")).toBe(true);
    restoreEnv();
  });

  it("applies defaults when env var is not set", () => {
    const schema = defineConfig({
      port: { env: "PORT", type: "int", default: 3000 },
      host: { env: "HOST", default: "localhost" },
    });
    const pack = ConfigModule.forRoot({ schema, validate: false });
    const valuesProvider = pack.providers!.find(
      (p: any) => p.token === CONFIG_VALUES,
    ) as any;
    const map = valuesProvider.useValue as Map<string, unknown>;
    expect(map.get("port")).toBe(3000);
    expect(map.get("host")).toBe("localhost");
    restoreEnv();
  });

  it("validates required fields and throws when missing", () => {
    const schema = defineConfig({
      secret: { env: "JWT_SECRET", required: true },
    });
    expect(() => ConfigModule.forRoot({ schema, validate: true })).toThrow();
    restoreEnv();
  });

  it("does not throw for required field that has a value", () => {
    process.env.JWT_SECRET = "my-secret";
    const schema = defineConfig({
      secret: { env: "JWT_SECRET", required: true },
    });
    expect(() => ConfigModule.forRoot({ schema, validate: true })).not.toThrow();
    restoreEnv();
  });

  it("fails fast with all errors at once", () => {
    const schema = defineConfig({
      secret: { env: "JWT_SECRET", required: true },
      port: { env: "PORT", type: "int", required: true },
    });
    try {
      ConfigModule.forRoot({ schema, validate: true });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err) {
      const message = (err as Error).message;
      // Should contain both errors, not just the first one
      expect(message).toContain("2 error(s)");
      expect(message).toContain("JWT_SECRET");
      expect(message).toContain("PORT");
    }
    restoreEnv();
  });

  it("does not validate when validate is false", () => {
    const schema = defineConfig({
      secret: { env: "JWT_SECRET", required: true },
    });
    // Should not throw even though JWT_SECRET is missing
    expect(() => ConfigModule.forRoot({ schema, validate: false })).not.toThrow();
    restoreEnv();
  });

  it("exports ConfigService, CONFIG_VALUES, and CONFIG_SCHEMA", () => {
    const schema = defineConfig({
      port: { env: "PORT", type: "int", default: 3000 },
    });
    const pack = ConfigModule.forRoot({ schema });
    expect(pack.exports).toContain(ConfigService);
    expect(pack.exports).toContain(CONFIG_VALUES);
    expect(pack.exports).toContain(CONFIG_SCHEMA);
    restoreEnv();
  });

  it("registers ConfigService as a provider", () => {
    const schema = defineConfig({
      port: { env: "PORT", type: "int", default: 3000 },
    });
    const pack = ConfigModule.forRoot({ schema });
    expect(pack.providers).toContain(ConfigService);
    restoreEnv();
  });

  it("field defaults to required when required is not explicitly set", () => {
    // When required is not set (undefined), the field should be treated as required
    const schema = defineConfig({
      secret: { env: "JWT_SECRET" },
    });
    expect(() => ConfigModule.forRoot({ schema, validate: true })).toThrow();
    restoreEnv();
  });

  it("field with required: false does not throw when missing", () => {
    const schema = defineConfig({
      optional: { env: "NONEXISTENT_VAR", required: false },
    });
    expect(() => ConfigModule.forRoot({ schema, validate: true })).not.toThrow();
    restoreEnv();
  });
});

describe("ConfigModule.forRootAsync", () => {
  it("creates a pack definition with async providers", () => {
    const pack = ConfigModule.forRootAsync({
      useFactory: async () => ({
        schema: defineConfig({
          port: { env: "PORT", type: "int", default: 3000 },
        }),
      }),
    });
    expect(pack).toBeDefined();
    expect(pack.providers).toBeDefined();
    expect(pack.providers!.length).toBeGreaterThan(0);
    expect(pack.exports).toContain(ConfigService);
  });
});
