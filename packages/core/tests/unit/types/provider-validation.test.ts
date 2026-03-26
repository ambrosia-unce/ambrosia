/**
 * Provider validation tests
 *
 * Tests stricter validation of provider configuration:
 * - Arrow functions rejected as useClass
 * - Token validation
 */

import { describe, expect, test } from "bun:test";
import "reflect-metadata";
import { InvalidProviderError } from "../../../src/container/errors.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { validateProvider } from "../../../src/types/provider.ts";
import { InjectionToken } from "../../../src/types/token.ts";

describe("Provider validation", () => {
  describe("ClassProvider validation", () => {
    test("accepts regular class", () => {
      @Injectable()
      class Valid {}

      expect(() => validateProvider({ token: Valid, useClass: Valid })).not.toThrow();
    });

    test("accepts function constructor", () => {
      function OldStyleClass() {}
      OldStyleClass.prototype.doStuff = () => {};

      expect(() =>
        validateProvider({
          token: new InjectionToken("old"),
          useClass: OldStyleClass as any,
        }),
      ).not.toThrow();
    });

    test("rejects arrow function as useClass", () => {
      const arrowFn = () => {};

      expect(() =>
        validateProvider({
          token: new InjectionToken("arrow"),
          useClass: arrowFn as any,
        }),
      ).toThrow(InvalidProviderError);
    });

    test("rejects non-function as useClass", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("bad"),
          useClass: "not-a-function" as any,
        }),
      ).toThrow(InvalidProviderError);
    });
  });

  describe("Token validation", () => {
    test("accepts class as token", () => {
      class MyClass {}
      expect(() => validateProvider({ token: MyClass, useValue: "x" })).not.toThrow();
    });

    test("accepts InjectionToken as token", () => {
      const token = new InjectionToken("valid");
      expect(() => validateProvider({ token, useValue: "x" })).not.toThrow();
    });

    test("rejects undefined token", () => {
      expect(() => validateProvider({ token: undefined as any, useValue: "x" })).toThrow(
        InvalidProviderError,
      );
    });

    test("rejects null token", () => {
      expect(() => validateProvider({ token: null as any, useValue: "x" })).toThrow(
        InvalidProviderError,
      );
    });

    test("rejects string token", () => {
      expect(() => validateProvider({ token: "string-token" as any, useValue: "x" })).toThrow(
        InvalidProviderError,
      );
    });

    test("rejects number token", () => {
      expect(() => validateProvider({ token: 42 as any, useValue: "x" })).toThrow(
        InvalidProviderError,
      );
    });
  });

  describe("Provider type validation", () => {
    test("rejects provider with no type (no useClass/useValue/useFactory/useExisting)", () => {
      expect(() => validateProvider({ token: new InjectionToken("empty") } as any)).toThrow(
        InvalidProviderError,
      );
    });

    test("rejects provider with multiple types", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("multi"),
          useValue: "x",
          useFactory: () => "y",
        } as any),
      ).toThrow(InvalidProviderError);
    });
  });

  describe("FactoryProvider validation", () => {
    test("accepts valid factory", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("factory"),
          useFactory: () => 42,
        }),
      ).not.toThrow();
    });

    test("rejects non-function useFactory", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("bad-factory"),
          useFactory: "not-a-function" as any,
        }),
      ).toThrow(InvalidProviderError);
    });
  });

  describe("ExistingProvider validation", () => {
    test("accepts valid existing token", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("alias"),
          useExisting: new InjectionToken("target"),
        }),
      ).not.toThrow();
    });
  });

  describe("Scope validation", () => {
    test("rejects non-string scope", () => {
      expect(() =>
        validateProvider({
          token: new InjectionToken("bad-scope"),
          useValue: "x",
          scope: 42 as any,
        }),
      ).toThrow(InvalidProviderError);
    });
  });
});
