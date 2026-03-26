/**
 * PathMatcher tests — normalization, regex caching, param extraction
 */

import { describe, expect, test } from "bun:test";
import {
  extractParamNames,
  extractParams,
  matches,
  normalize,
  pathToRegex,
} from "../../../src/routing/path-matcher.ts";

describe("PathMatcher", () => {
  describe("normalize", () => {
    test("adds leading slash", () => {
      expect(normalize("users")).toBe("/users");
    });

    test("removes trailing slash", () => {
      expect(normalize("/users/")).toBe("/users");
    });

    test("handles multiple slashes", () => {
      expect(normalize("//users//")).toBe("/users");
    });

    test("root path", () => {
      expect(normalize("/")).toBe("/");
      expect(normalize("")).toBe("/");
    });

    test("trims whitespace", () => {
      expect(normalize("  /users  ")).toBe("/users");
    });
  });

  describe("pathToRegex", () => {
    test("creates regex from simple path", () => {
      const regex = pathToRegex("/users");
      expect(regex.test("/users")).toBe(true);
      expect(regex.test("/posts")).toBe(false);
    });

    test("creates regex with param", () => {
      const regex = pathToRegex("/users/:id");
      expect(regex.test("/users/123")).toBe(true);
      expect(regex.test("/users/abc")).toBe(true);
      expect(regex.test("/users/")).toBe(false);
      expect(regex.test("/users/123/posts")).toBe(false);
    });

    test("caches regex for same pattern", () => {
      const regex1 = pathToRegex("/cached/:id");
      const regex2 = pathToRegex("/cached/:id");
      expect(regex1).toBe(regex2); // Same reference = cached
    });

    test("different patterns get different regexes", () => {
      const regex1 = pathToRegex("/a/:id");
      const regex2 = pathToRegex("/b/:id");
      expect(regex1).not.toBe(regex2);
    });
  });

  describe("extractParamNames", () => {
    test("extracts single param", () => {
      expect(extractParamNames("/users/:id")).toEqual(["id"]);
    });

    test("extracts multiple params", () => {
      expect(extractParamNames("/posts/:postId/comments/:commentId")).toEqual([
        "postId",
        "commentId",
      ]);
    });

    test("no params", () => {
      expect(extractParamNames("/users")).toEqual([]);
    });
  });

  describe("matches", () => {
    test("matches exact path", () => {
      expect(matches("/users", "/users")).toBe(true);
    });

    test("matches path with params", () => {
      expect(matches("/users/:id", "/users/123")).toBe(true);
    });

    test("rejects wrong path", () => {
      expect(matches("/users/:id", "/posts/123")).toBe(false);
    });

    test("rejects extra segments", () => {
      expect(matches("/users/:id", "/users/123/extra")).toBe(false);
    });
  });

  describe("extractParams", () => {
    test("extracts single param", () => {
      expect(extractParams("/users/:id", "/users/123")).toEqual({ id: "123" });
    });

    test("extracts multiple params", () => {
      expect(extractParams("/posts/:postId/comments/:commentId", "/posts/1/comments/2")).toEqual({
        postId: "1",
        commentId: "2",
      });
    });

    test("returns null on mismatch", () => {
      expect(extractParams("/users/:id", "/posts/123")).toBeNull();
    });

    test("handles root path", () => {
      expect(extractParams("/", "/")).toEqual({});
    });
  });
});
