import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { Injectable } from "@ambrosia/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import { Body, Param, Query, Header, Headers } from "../decorators/parameters.ts";
import { Status, SetHeader } from "../decorators/response.ts";
import { TestingHttpFactory, type TestingHttpModule } from "../testing/testing-http-factory.ts";

// --- Test Controllers ---

@Controller("/health")
class HealthController {
  @Http.Get("/")
  check() {
    return { status: "ok" };
  }
}

@Controller("/users")
class UserController {
  @Http.Get("/")
  list() {
    return [{ id: 1, name: "Alice" }];
  }

  @Http.Get("/:id")
  getOne(@Param("id") id: string) {
    return { id, name: "User " + id };
  }

  @Http.Post("/")
  create(@Body() body: any) {
    return { id: "new", ...body };
  }

  @Http.Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return { id, ...body };
  }

  @Http.Delete("/:id")
  remove(@Param("id") id: string) {
    return { deleted: id };
  }

  @Http.Patch("/:id")
  patch(@Param("id") id: string, @Body() body: any) {
    return { id, patched: true, ...body };
  }
}

@Controller("/search")
class SearchController {
  @Http.Get("/")
  search(@Query() query: any) {
    return { results: [], query };
  }

  @Http.Get("/filter")
  filter(@Query("category") category: string) {
    return { category };
  }
}

@Controller("/status-test")
class StatusController {
  @Http.Post("/")
  @Status(201)
  create(@Body() body: any) {
    return body;
  }

  @Http.Delete("/:id")
  @Status(204)
  remove(@Param("id") id: string) {
    return null;
  }
}

@Controller("/header-test")
class HeaderController {
  @Http.Get("/")
  @SetHeader("X-Custom", "test-value")
  @SetHeader("Cache-Control", "no-cache")
  getData() {
    return { data: "hello" };
  }
}

// --- Tests ---

describe("Routing", () => {
  describe("GET routes", () => {
    it("should return response from a simple GET route", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [HealthController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/health" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: "ok" });

      await module.close();
    });

    it("should return a list from GET /users", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/users" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: "Alice" }]);

      await module.close();
    });
  });

  describe("Route with URL params", () => {
    it("should extract URL params via @Param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/users/42" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: "42", name: "User 42" });

      await module.close();
    });
  });

  describe("POST route with body", () => {
    it("should receive body via @Body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/users",
        body: { name: "Bob", email: "bob@test.com" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: "new", name: "Bob", email: "bob@test.com" });

      await module.close();
    });
  });

  describe("PUT route with params and body", () => {
    it("should receive both params and body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({
        method: "PUT",
        url: "/users/5",
        body: { name: "Updated" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: "5", name: "Updated" });

      await module.close();
    });
  });

  describe("DELETE route", () => {
    it("should handle DELETE with param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({ method: "DELETE", url: "/users/10" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ deleted: "10" });

      await module.close();
    });
  });

  describe("PATCH route", () => {
    it("should handle PATCH with param and body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const res = await module.inject({
        method: "PATCH",
        url: "/users/7",
        body: { name: "Patched" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: "7", patched: true, name: "Patched" });

      await module.close();
    });
  });

  describe("Route with query params", () => {
    it("should inject all query params via @Query()", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [SearchController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/search?q=hello&page=1",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.query).toEqual({ q: "hello", page: "1" });

      await module.close();
    });

    it("should inject a single query param via @Query('key')", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [SearchController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/search/filter?category=electronics",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ category: "electronics" });

      await module.close();
    });
  });

  describe("Multiple methods on same controller", () => {
    it("should register all HTTP methods correctly", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      const getRes = await module.inject({ method: "GET", url: "/users" });
      expect(getRes.statusCode).toBe(200);

      const postRes = await module.inject({
        method: "POST",
        url: "/users",
        body: { name: "Test" },
      });
      expect(postRes.statusCode).toBe(200);

      const putRes = await module.inject({
        method: "PUT",
        url: "/users/1",
        body: { name: "Updated" },
      });
      expect(putRes.statusCode).toBe(200);

      const deleteRes = await module.inject({ method: "DELETE", url: "/users/1" });
      expect(deleteRes.statusCode).toBe(200);

      const patchRes = await module.inject({
        method: "PATCH",
        url: "/users/1",
        body: { name: "Patched" },
      });
      expect(patchRes.statusCode).toBe(200);

      await module.close();
    });
  });

  describe("Controller with base path prefix", () => {
    it("should prefix all routes with controller path", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [UserController],
      }).compile();

      // /users is the base path
      const res = await module.inject({ method: "GET", url: "/users" });
      expect(res.statusCode).toBe(200);

      // Without base path should 404
      const notFound = await module.inject({ method: "GET", url: "/" });
      expect(notFound.statusCode).toBe(404);

      await module.close();
    });
  });

  describe("@Status decorator", () => {
    it("should set 201 status code on creation", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [StatusController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/status-test",
        body: { name: "New" },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ name: "New" });

      await module.close();
    });

    it("should set 204 status code on deletion", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [StatusController],
      }).compile();

      const res = await module.inject({ method: "DELETE", url: "/status-test/1" });

      expect(res.statusCode).toBe(204);

      await module.close();
    });
  });

  describe("@SetHeader decorator", () => {
    it("should set response headers", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [HeaderController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/header-test" });

      expect(res.statusCode).toBe(200);
      expect(res.headers["X-Custom"]).toBe("test-value");
      expect(res.headers["Cache-Control"]).toBe("no-cache");

      await module.close();
    });
  });

  describe("Route not found", () => {
    it("should return 404 for non-existent routes", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [HealthController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/nonexistent" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Not Found");

      await module.close();
    });

    it("should return 404 for wrong HTTP method", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [HealthController],
      }).compile();

      const res = await module.inject({ method: "POST", url: "/health" });

      expect(res.statusCode).toBe(404);

      await module.close();
    });
  });
});
