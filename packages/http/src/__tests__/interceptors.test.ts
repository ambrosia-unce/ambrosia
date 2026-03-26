import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Injectable } from "@ambrosia-unce/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import { UseInterceptor } from "../decorators/lifecycle.ts";
import type { Interceptor } from "../interceptors/interceptor.interface.ts";
import type { CallHandler } from "../context/call-handler.ts";
import type { ExecutionContext } from "../context/execution-context.ts";
import { TestingHttpFactory } from "../testing/testing-http-factory.ts";

// --- Test Interceptors ---

@Injectable()
class WrapInterceptor implements Interceptor {
  async intercept(_context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();
    return { data: result, wrapped: true };
  }
}

@Injectable()
class TimingInterceptor implements Interceptor {
  async intercept(_context: ExecutionContext, next: CallHandler): Promise<any> {
    const start = Date.now();
    const result = await next.handle();
    const duration = Date.now() - start;
    return { ...result, timing: duration >= 0 };
  }
}

@Injectable()
class UpperCaseInterceptor implements Interceptor {
  async intercept(_context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();
    if (result && typeof result.message === "string") {
      return { ...result, message: result.message.toUpperCase() };
    }
    return result;
  }
}

@Injectable()
class AddHeaderInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    // Modify before handler
    const http = context.switchToHttp();
    http.getResponse().setHeader("X-Intercepted", "true");

    const result = await next.handle();
    return result;
  }
}

// --- Test Controllers ---

@Controller("/intercepted-method")
class MethodInterceptedController {
  @Http.Get("/")
  @UseInterceptor(WrapInterceptor)
  getData() {
    return { value: 42 };
  }

  @Http.Get("/no-interceptor")
  raw() {
    return { value: "raw" };
  }
}

@Controller("/intercepted-class")
@UseInterceptor(WrapInterceptor)
class ClassInterceptedController {
  @Http.Get("/a")
  getA() {
    return { route: "a" };
  }

  @Http.Get("/b")
  getB() {
    return { route: "b" };
  }
}

@Controller("/intercepted-transform")
class TransformController {
  @Http.Get("/")
  @UseInterceptor(UpperCaseInterceptor)
  getMessage() {
    return { message: "hello world" };
  }
}

@Controller("/intercepted-header")
class HeaderInterceptorController {
  @Http.Get("/")
  @UseInterceptor(AddHeaderInterceptor)
  getData() {
    return { ok: true };
  }
}

@Controller("/intercepted-timing")
class TimingController {
  @Http.Get("/")
  @UseInterceptor(TimingInterceptor)
  getData() {
    return { result: "fast" };
  }
}

// --- Tests ---

describe("Interceptors", () => {
  describe("Interceptor wraps handler", () => {
    it("should wrap the handler result", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [MethodInterceptedController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/intercepted-method" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: { value: 42 }, wrapped: true });

      await module.close();
    });
  });

  describe("Interceptor can modify response", () => {
    it("should transform the response data", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [TransformController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/intercepted-transform" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "HELLO WORLD" });

      await module.close();
    });
  });

  describe("Interceptor timing (before/after handler)", () => {
    it("should execute code before and after handler", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [TimingController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/intercepted-timing" });

      expect(res.statusCode).toBe(200);
      expect(res.body.result).toBe("fast");
      expect(res.body.timing).toBe(true);

      await module.close();
    });

    it("should set response headers before handler runs", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [HeaderInterceptorController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/intercepted-header" });

      expect(res.statusCode).toBe(200);
      expect(res.headers["X-Intercepted"]).toBe("true");
      expect(res.body).toEqual({ ok: true });

      await module.close();
    });
  });

  describe("@UseInterceptor on controller level", () => {
    it("should apply interceptor to all routes", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ClassInterceptedController],
      }).compile();

      const resA = await module.inject({ method: "GET", url: "/intercepted-class/a" });
      expect(resA.statusCode).toBe(200);
      expect(resA.body).toEqual({ data: { route: "a" }, wrapped: true });

      const resB = await module.inject({ method: "GET", url: "/intercepted-class/b" });
      expect(resB.statusCode).toBe(200);
      expect(resB.body).toEqual({ data: { route: "b" }, wrapped: true });

      await module.close();
    });
  });

  describe("@UseInterceptor on method level", () => {
    it("should apply interceptor only to the decorated method", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [MethodInterceptedController],
      }).compile();

      // Intercepted route
      const intercepted = await module.inject({ method: "GET", url: "/intercepted-method" });
      expect(intercepted.body).toEqual({ data: { value: 42 }, wrapped: true });

      // Non-intercepted route
      const raw = await module.inject({ method: "GET", url: "/intercepted-method/no-interceptor" });
      expect(raw.body).toEqual({ value: "raw" });

      await module.close();
    });
  });
});
