/**
 * ParseIntPipe tests
 */

import { describe, expect, test } from "bun:test";
import "reflect-metadata";
import { BadRequestException } from "../../../src/exceptions/built-in-exceptions.ts";
import { ParseIntPipe } from "../../../src/pipes/parse-int-pipe.ts";

describe("ParseIntPipe", () => {
  const pipe = new ParseIntPipe();

  test("transforms valid integer string", () => {
    expect(pipe.transform("42")).toBe(42);
    expect(pipe.transform("0")).toBe(0);
    expect(pipe.transform("-1")).toBe(-1);
    expect(pipe.transform("100")).toBe(100);
  });

  test("throws on non-integer string", () => {
    expect(() => pipe.transform("abc")).toThrow(BadRequestException);
    expect(() => pipe.transform("")).toThrow(BadRequestException);
    expect(() => pipe.transform("12.5")).toBe; // parseInt("12.5") = 12, valid
  });

  test("throws on NaN", () => {
    expect(() => pipe.transform("NaN")).toThrow(BadRequestException);
  });

  test("throws on unsafe integer (too large)", () => {
    // Number.MAX_SAFE_INTEGER = 9007199254740991
    expect(() => pipe.transform("99999999999999999")).toThrow(BadRequestException);
    expect(() => pipe.transform("9007199254740992")).toThrow(BadRequestException); // MAX_SAFE + 1
  });

  test("accepts MAX_SAFE_INTEGER", () => {
    expect(pipe.transform("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("accepts MIN_SAFE_INTEGER", () => {
    expect(pipe.transform("-9007199254740991")).toBe(Number.MIN_SAFE_INTEGER);
  });
});
