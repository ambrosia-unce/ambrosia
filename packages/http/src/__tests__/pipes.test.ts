import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Injectable } from "@ambrosia/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import { Body, Param } from "../decorators/parameters.ts";
import { UsePipe } from "../decorators/lifecycle.ts";
import type { Pipe, PipeMetadata } from "../pipes/pipe.interface.ts";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import { TestingHttpFactory } from "../testing/testing-http-factory.ts";

// --- Test Pipes ---

@Injectable()
class TrimPipe implements Pipe {
  transform(value: any, _metadata?: PipeMetadata): any {
    if (typeof value === "string") {
      return value.trim();
    }
    if (value && typeof value === "object") {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = typeof v === "string" ? v.trim() : v;
      }
      return result;
    }
    return value;
  }
}

@Injectable()
class ValidationPipe implements Pipe {
  transform(value: any, _metadata?: PipeMetadata): any {
    if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
      throw new BadRequestException("Validation failed: body is required");
    }
    return value;
  }
}

@Injectable()
class UpperCasePipe implements Pipe {
  transform(value: any, _metadata?: PipeMetadata): any {
    if (typeof value === "string") {
      return value.toUpperCase();
    }
    return value;
  }
}

// --- Test Controllers ---

@Controller("/piped")
class PipedController {
  @Http.Post("/trim")
  @UsePipe(TrimPipe)
  create(@Body() body: any) {
    return body;
  }

  @Http.Post("/validate")
  @UsePipe(ValidationPipe)
  validated(@Body() body: any) {
    return body;
  }

  @Http.Get("/:name")
  @UsePipe(UpperCasePipe)
  getByName(@Param("name") name: string) {
    return { name };
  }
}

@Controller("/piped-class")
@UsePipe(TrimPipe)
class ClassPipedController {
  @Http.Post("/")
  create(@Body() body: any) {
    return body;
  }
}

// --- Tests ---

describe("Pipes", () => {
  describe("Pipe transforms body value", () => {
    it("should trim string values in body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [PipedController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/piped/trim",
        body: { name: "  Alice  ", email: " alice@test.com " },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ name: "Alice", email: "alice@test.com" });

      await module.close();
    });
  });

  describe("Pipe validation - throws on invalid input", () => {
    it("should reject empty body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [PipedController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/piped/validate",
        body: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Validation failed");

      await module.close();
    });

    it("should accept valid body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [PipedController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/piped/validate",
        body: { name: "Valid" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ name: "Valid" });

      await module.close();
    });
  });

  describe("Pipe transforms param value", () => {
    it("should transform URL param to uppercase", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [PipedController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/piped/hello",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ name: "HELLO" });

      await module.close();
    });
  });

  describe("@UsePipe on controller level", () => {
    it("should apply pipe to all routes on the controller", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ClassPipedController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/piped-class",
        body: { name: "  Trimmed  " },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ name: "Trimmed" });

      await module.close();
    });
  });
});
