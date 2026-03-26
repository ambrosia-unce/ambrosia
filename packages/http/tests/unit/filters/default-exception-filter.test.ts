/**
 * DefaultExceptionFilter tests
 */

import { describe, expect, test } from "bun:test";
import "reflect-metadata";
import {
  BadRequestException,
  NotFoundException,
} from "../../../src/exceptions/built-in-exceptions.ts";
import { HttpException } from "../../../src/exceptions/http-exception.ts";
import { DefaultExceptionFilter } from "../../../src/filters/default-exception-filter.ts";
import { HttpStatus } from "../../../src/types/common.ts";

function createMockContext() {
  let status = 200;
  return {
    request: { path: "/test" },
    response: {
      get status() {
        return status;
      },
      setStatus(s: number) {
        status = s;
      },
    },
  } as any;
}

describe("DefaultExceptionFilter", () => {
  const filter = new DefaultExceptionFilter();

  test("handles HttpException", () => {
    const ctx = createMockContext();
    const result = filter.catch({
      exception: new BadRequestException("bad input"),
      httpContext: ctx,
    });

    expect(result.statusCode).toBe(400);
    expect(result.message).toBe("bad input");
    expect(result.error).toBe("Bad Request");
  });

  test("handles NotFoundException", () => {
    const ctx = createMockContext();
    const result = filter.catch({
      exception: new NotFoundException("user not found"),
      httpContext: ctx,
    });

    expect(result.statusCode).toBe(404);
    expect(result.message).toBe("user not found");
  });

  test("handles standard Error", () => {
    const ctx = createMockContext();
    const result = filter.catch({
      exception: new Error("something broke"),
      httpContext: ctx,
    });

    expect(result.statusCode).toBe(500);
    expect(result.error).toBe("Internal Server Error");
    expect(result.message).toBe("something broke");
  });

  test("handles non-Error exception", () => {
    const ctx = createMockContext();
    const result = filter.catch({
      exception: "string error",
      httpContext: ctx,
    });

    expect(result.statusCode).toBe(500);
    expect(result.error).toBe("Internal Server Error");
    expect(result.message).toBe("Unknown error occurred");
  });

  test("includes timestamp and path", () => {
    const ctx = createMockContext();
    const result = filter.catch({
      exception: new Error("test"),
      httpContext: ctx,
    });

    expect(result.timestamp).toBeDefined();
    expect(result.path).toBe("/test");
  });

  test("sets response status code", () => {
    const ctx = createMockContext();
    filter.catch({
      exception: new BadRequestException("bad"),
      httpContext: ctx,
    });

    expect(ctx.response.status).toBe(400);
  });
});
