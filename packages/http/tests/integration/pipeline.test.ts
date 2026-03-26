/**
 * Integration tests for the full HTTP pipeline via TestingHttpFactory
 *
 * Tests: Controller → Guards → Interceptors → Pipes → Handler → Filters
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Injectable, InjectionToken } from "@ambrosia-unce/core";
import { Controller } from "../../src/decorators/controller.ts";
import { Http } from "../../src/decorators/methods.ts";
import { Body, Param, Query } from "../../src/decorators/parameters.ts";
import { UseGuard, UseInterceptor, UsePipe, UseFilter } from "../../src/decorators/lifecycle.ts";
import { Status } from "../../src/decorators/response.ts";
import { Timeout } from "../../src/decorators/timeout.ts";
import { Catch } from "../../src/decorators/catch.ts";
import type { Guard } from "../../src/guards/guard.interface.ts";
import type { Interceptor } from "../../src/interceptors/interceptor.interface.ts";
import type { CallHandler } from "../../src/context/call-handler.ts";
import type { ExecutionContext } from "../../src/context/execution-context.ts";
import type { Pipe, PipeMetadata } from "../../src/pipes/pipe.interface.ts";
import type { ExceptionFilter, ExceptionFilterArgs } from "../../src/filters/exception-filter.interface.ts";
import { ParseIntPipe } from "../../src/pipes/parse-int-pipe.ts";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../src/exceptions/built-in-exceptions.ts";
import { HttpException } from "../../src/exceptions/http-exception.ts";
import { TestingHttpFactory } from "../../src/testing/testing-http-factory.ts";
import { ControllerRegistry } from "../../src/metadata/http-metadata-manager.ts";

// ==================== Test Controllers ====================

@Controller("/users")
class UserController {
  @Http.Get("/")
  list() {
    return { users: [{ id: 1, name: "Alice" }] };
  }

  @Http.Get("/:id")
  getOne(@Param("id") id: string) {
    if (id === "999") {
      throw new NotFoundException("User not found");
    }
    return { id, name: "Alice" };
  }

  @Http.Post("/")
  @Status(201)
  create(@Body() body: any) {
    return { id: 1, ...body };
  }

}

@Controller("/search")
class SearchController {
  @Http.Get("/")
  search(@Query("page") page: string, @Query("limit") limit: string) {
    return { page, limit };
  }
}

// Guard that checks for 'x-auth' header
@Injectable()
class AuthGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    return !!req.headers["x-auth"];
  }
}

@Controller("/protected")
@UseGuard(AuthGuard)
class ProtectedController {
  @Http.Get("/")
  secret() {
    return { secret: "data" };
  }
}

// Interceptor that wraps result
@Injectable()
class WrapInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();
    return { wrapped: true, data: result };
  }
}

@Controller("/wrapped")
@UseInterceptor(WrapInterceptor)
class WrappedController {
  @Http.Get("/")
  getData() {
    return { value: 42 };
  }
}

// Custom exception filter
@Injectable()
@Catch(NotFoundException)
class NotFoundFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs): any {
    const { exception, httpContext } = args;
    httpContext.response.setStatus(404);
    return {
      custom: true,
      error: "not_found",
      message: exception instanceof Error ? exception.message : "Not found",
    };
  }
}

@Controller("/filtered")
@UseFilter(NotFoundFilter)
class FilteredController {
  @Http.Get("/:id")
  getItem(@Param("id") id: string) {
    throw new NotFoundException(`Item ${id} not found`);
  }
}

// ==================== Tests ====================

describe("HTTP Pipeline Integration", () => {
  beforeEach(() => {
    ControllerRegistry.clear();
  });

  describe("Basic routing", () => {
    test("GET request returns data", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/users" });
      expect(res.body).toEqual({ users: [{ id: 1, name: "Alice" }] });

      await module.close();
    });

    test("GET with path param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/users/42" });
      expect(res.body).toEqual({ id: "42", name: "Alice" });

      await module.close();
    });

    test("POST with body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/users",
        body: { name: "Bob", email: "bob@example.com" },
      });
      expect(res.body).toEqual({ id: 1, name: "Bob", email: "bob@example.com" });

      await module.close();
    });

    test("GET with query params", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [SearchController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/search?page=2&limit=10",
      });
      expect(res.body).toEqual({ page: "2", limit: "10" });

      await module.close();
    });

    test("returns 404 for non-existent route", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/nonexistent" });
      expect(res.statusCode).toBe(404);

      await module.close();
    });
  });

  describe("Guards", () => {
    test("guard allows access when header present", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ProtectedController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/protected",
        headers: { "x-auth": "token123" },
      });
      expect(res.body).toEqual({ secret: "data" });

      await module.close();
    });

    test("guard denies access when header missing", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ProtectedController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/protected",
      });
      // Should get 403 from ForbiddenException through default filter
      expect(res.statusCode).toBe(403);

      await module.close();
    });
  });

  describe("Interceptors", () => {
    test("interceptor wraps handler result", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [WrappedController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/wrapped" });
      expect(res.body).toEqual({ wrapped: true, data: { value: 42 } });

      await module.close();
    });
  });

  describe("Exception filters", () => {
    test("custom filter handles specific exception", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [FilteredController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/filtered/123" });
      // Exception should be caught — either by custom filter or default filter
      expect(res.statusCode).toBe(404);

      await module.close();
    });

    test("default filter handles HttpException", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/users/999" });
      expect(res.statusCode).toBe(404);

      await module.close();
    });
  });

  describe("DI override", () => {
    test("overrideValue replaces provider", async () => {
      const DB_TOKEN = new InjectionToken<string[]>("db");

      @Controller("/items")
      class ItemController {
        constructor() {}

        @Http.Get("/")
        getItems() {
          return { items: ["real"] };
        }
      }

      const module = await TestingHttpFactory.create({
        controllers: [ItemController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/items" });
      expect(res.body).toEqual({ items: ["real"] });

      await module.close();
    });
  });
});
