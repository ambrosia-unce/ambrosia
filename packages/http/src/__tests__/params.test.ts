import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Injectable } from "@ambrosia-unce/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import {
  Body,
  Query,
  Param,
  Headers,
  Header,
  Req,
  Ctx,
  Ip,
  Cookie,
} from "../decorators/parameters.ts";
import type { IHttpRequest } from "../types/common.ts";
import { TestingHttpFactory } from "../testing/testing-http-factory.ts";

// --- Test Controllers ---

@Controller("/params-test")
class ParamsController {
  @Http.Post("/body")
  withBody(@Body() body: any) {
    return { received: body };
  }

  @Http.Get("/query-all")
  withQueryAll(@Query() query: any) {
    return { query };
  }

  @Http.Get("/query-single")
  withQuerySingle(@Query("name") name: string) {
    return { name };
  }

  @Http.Get("/param/:id")
  withParam(@Param("id") id: string) {
    return { id };
  }

  @Http.Get("/params/:userId/posts/:postId")
  withMultipleParams(@Param("userId") userId: string, @Param("postId") postId: string) {
    return { userId, postId };
  }

  @Http.Get("/headers-all")
  withHeaders(@Headers() headers: any) {
    return { hasHeaders: Object.keys(headers).length > 0 };
  }

  @Http.Get("/header-single")
  withHeader(@Header("x-custom") custom: string) {
    return { custom };
  }

  @Http.Get("/request")
  withRequest(@Req() req: IHttpRequest) {
    return {
      method: req.method,
      path: req.path,
      url: req.url,
    };
  }

  @Http.Get("/ip")
  withIp(@Ip() ip: string) {
    return { ip };
  }

  @Http.Get("/cookie")
  withCookie(@Cookie("session") session: string) {
    return { session };
  }

  @Http.Get("/combined/:id")
  combined(
    @Param("id") id: string,
    @Query("format") format: string,
    @Header("accept") accept: string,
  ) {
    return { id, format, accept };
  }
}

// --- Tests ---

describe("Parameter Decorators", () => {
  describe("@Body()", () => {
    it("should inject the full request body", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/params-test/body",
        body: { name: "Alice", age: 30 },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ received: { name: "Alice", age: 30 } });

      await module.close();
    });

    it("should inject null body when no body is sent", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "POST",
        url: "/params-test/body",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ received: null });

      await module.close();
    });
  });

  describe("@Query()", () => {
    it("should inject all query params", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/query-all?foo=bar&baz=qux",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.query).toEqual({ foo: "bar", baz: "qux" });

      await module.close();
    });

    it("should inject a single query param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/query-single?name=Bob",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ name: "Bob" });

      await module.close();
    });

    it("should return undefined for missing query param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/query-single",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBeUndefined();

      await module.close();
    });
  });

  describe("@Param()", () => {
    it("should inject a single URL param", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/param/123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: "123" });

      await module.close();
    });

    it("should inject multiple URL params", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/params/5/posts/10",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ userId: "5", postId: "10" });

      await module.close();
    });
  });

  describe("@Headers()", () => {
    it("should inject all request headers", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/headers-all",
        headers: { "content-type": "application/json" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.hasHeaders).toBe(true);

      await module.close();
    });
  });

  describe("@Header(key)", () => {
    it("should inject a single header value", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/header-single",
        headers: { "x-custom": "my-value" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ custom: "my-value" });

      await module.close();
    });
  });

  describe("@Req()", () => {
    it("should inject the raw request object", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/request",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.method).toBe("GET");
      expect(res.body.path).toBe("/params-test/request");

      await module.close();
    });
  });

  describe("@Ip()", () => {
    it("should inject the client IP address", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/ip",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.ip).toBe("127.0.0.1");

      await module.close();
    });
  });

  describe("Combined parameter decorators", () => {
    it("should inject multiple parameter types simultaneously", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ParamsController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/params-test/combined/42?format=json",
        headers: { accept: "application/json" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        id: "42",
        format: "json",
        accept: "application/json",
      });

      await module.close();
    });
  });
});
