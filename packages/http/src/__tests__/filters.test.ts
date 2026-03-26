import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Injectable } from "@ambrosia-unce/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import { UseFilter } from "../decorators/lifecycle.ts";
import { Catch } from "../decorators/catch.ts";
import type { ExceptionFilter, ExceptionFilterArgs } from "../filters/exception-filter.interface.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/built-in-exceptions.ts";
import { HttpException } from "../exceptions/http-exception.ts";
import { TestingHttpFactory } from "../testing/testing-http-factory.ts";

// --- Test Filters ---

@Injectable()
class CustomExceptionFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs): any {
    const { exception, httpContext } = args;
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof Error ? exception.message : "Unknown error";

    httpContext.response.setStatus(status);

    return {
      custom: true,
      statusCode: status,
      message,
      path: httpContext.request.path,
    };
  }
}

@Catch(NotFoundException)
@Injectable()
class NotFoundFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs): any {
    const { httpContext } = args;
    httpContext.response.setStatus(404);
    return {
      error: "Resource not found",
      path: httpContext.request.path,
      custom: true,
    };
  }
}

@Catch(BadRequestException)
@Injectable()
class BadRequestFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs): any {
    const { exception, httpContext } = args;
    httpContext.response.setStatus(400);
    return {
      error: "Bad Request",
      details: exception.message,
      custom: true,
    };
  }
}

// --- Test Controllers ---

@Controller("/filter-test")
class FilterController {
  @Http.Get("/error")
  throwError() {
    throw new Error("Something went wrong");
  }

  @Http.Get("/not-found")
  throwNotFound() {
    throw new NotFoundException("User not found");
  }

  @Http.Get("/bad-request")
  throwBadRequest() {
    throw new BadRequestException("Invalid input");
  }

  @Http.Get("/ok")
  getData() {
    return { data: "ok" };
  }
}

@Controller("/custom-filter")
@UseFilter(CustomExceptionFilter)
class CustomFilterController {
  @Http.Get("/error")
  throwError() {
    throw new BadRequestException("Custom filtered error");
  }

  @Http.Get("/generic-error")
  throwGenericError() {
    throw new Error("Generic error");
  }
}

@Controller("/typed-filter")
@UseFilter(NotFoundFilter, BadRequestFilter)
class TypedFilterController {
  @Http.Get("/not-found")
  throwNotFound() {
    throw new NotFoundException("Item missing");
  }

  @Http.Get("/bad-request")
  throwBadRequest() {
    throw new BadRequestException("Bad data");
  }
}

// --- Tests ---

describe("Filters", () => {
  describe("Default exception filter catches error", () => {
    it("should handle unhandled errors with default filter", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [FilterController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/filter-test/error" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Something went wrong");
      expect(res.body.error).toBe("Internal Server Error");

      await module.close();
    });

    it("should handle HttpException with correct status", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [FilterController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/filter-test/not-found" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");

      await module.close();
    });

    it("should handle BadRequestException with 400 status", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [FilterController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/filter-test/bad-request" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid input");

      await module.close();
    });
  });

  describe("Custom filter returns custom response", () => {
    it("should use custom filter format when no global filters override", async () => {
      // Provide CustomExceptionFilter as the sole global filter so it runs first
      const module = await TestingHttpFactory.create({
        controllers: [CustomFilterController],
        globalFilters: [CustomExceptionFilter],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/custom-filter/error" });

      expect(res.body.custom).toBe(true);
      expect(res.body.message).toBe("Custom filtered error");
      expect(res.body.path).toBe("/custom-filter/error");

      await module.close();
    });

    it("should handle generic errors with custom filter", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [CustomFilterController],
        globalFilters: [CustomExceptionFilter],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/custom-filter/generic-error" });

      expect(res.body.custom).toBe(true);
      expect(res.body.statusCode).toBe(500);
      expect(res.body.message).toBe("Generic error");

      await module.close();
    });
  });

  describe("@Catch typed filter", () => {
    it("should catch NotFoundException with typed filter", async () => {
      // Use typed filters as global filters to test @Catch matching
      const module = await TestingHttpFactory.create({
        controllers: [TypedFilterController],
        globalFilters: [NotFoundFilter, BadRequestFilter],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/typed-filter/not-found" });

      expect(res.body.custom).toBe(true);
      expect(res.body.error).toBe("Resource not found");
      expect(res.body.path).toBe("/typed-filter/not-found");

      await module.close();
    });

    it("should catch BadRequestException with typed filter", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [TypedFilterController],
        globalFilters: [NotFoundFilter, BadRequestFilter],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/typed-filter/bad-request" });

      expect(res.body.custom).toBe(true);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.details).toBe("Bad data");

      await module.close();
    });
  });

  describe("No error - filter not triggered", () => {
    it("should not trigger filter on successful requests", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [FilterController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/filter-test/ok" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: "ok" });

      await module.close();
    });
  });
});
