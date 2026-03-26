import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Injectable } from "@ambrosia-unce/core";
import { Controller } from "../decorators/controller.ts";
import { Http } from "../decorators/methods.ts";
import { Header } from "../decorators/parameters.ts";
import { UseGuard } from "../decorators/lifecycle.ts";
import type { Guard } from "../guards/guard.interface.ts";
import type { ExecutionContext } from "../context/execution-context.ts";
import { TestingHttpFactory } from "../testing/testing-http-factory.ts";

// --- Test Guards ---

@Injectable()
class AllowGuard implements Guard {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

@Injectable()
class DenyGuard implements Guard {
  canActivate(_context: ExecutionContext): boolean {
    return false;
  }
}

@Injectable()
class ThrowingGuard implements Guard {
  canActivate(_context: ExecutionContext): boolean {
    throw new Error("Guard error");
  }
}

@Injectable()
class AuthGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const auth = req.headers["authorization"];
    return auth === "Bearer valid-token";
  }
}

@Injectable()
class SecondGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest();
    return req.headers["x-second"] === "pass";
  }
}

// --- Test Controllers ---

@Controller("/guarded-allow")
class AllowController {
  @Http.Get("/")
  @UseGuard(AllowGuard)
  getData() {
    return { data: "allowed" };
  }
}

@Controller("/guarded-deny")
class DenyController {
  @Http.Get("/")
  @UseGuard(DenyGuard)
  getData() {
    return { data: "should not reach" };
  }
}

@Controller("/guarded-throw")
class ThrowController {
  @Http.Get("/")
  @UseGuard(ThrowingGuard)
  getData() {
    return { data: "should not reach" };
  }
}

@Controller("/guarded-class")
@UseGuard(AuthGuard)
class ClassGuardedController {
  @Http.Get("/")
  getData() {
    return { data: "class-guarded" };
  }

  @Http.Get("/other")
  getOtherData() {
    return { data: "also-guarded" };
  }
}

@Controller("/guarded-method")
class MethodGuardedController {
  @Http.Get("/public")
  publicRoute() {
    return { data: "public" };
  }

  @Http.Get("/private")
  @UseGuard(AuthGuard)
  privateRoute() {
    return { data: "private" };
  }
}

@Controller("/multi-guard")
class MultiGuardController {
  @Http.Get("/")
  @UseGuard(AuthGuard, SecondGuard)
  getData() {
    return { data: "multi-guarded" };
  }
}

// --- Tests ---

describe("Guards", () => {
  describe("Guard that returns true", () => {
    it("should allow request to proceed", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [AllowController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/guarded-allow" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: "allowed" });

      await module.close();
    });
  });

  describe("Guard that returns false", () => {
    it("should block request with 403", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [DenyController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/guarded-deny" });

      expect(res.statusCode).toBe(403);

      await module.close();
    });
  });

  describe("Guard that throws", () => {
    it("should propagate the error", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ThrowController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/guarded-throw" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Guard error");

      await module.close();
    });
  });

  describe("@UseGuard on controller level", () => {
    it("should apply guard to all routes when auth header is valid", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ClassGuardedController],
      }).compile();

      const res = await module.inject({
        method: "GET",
        url: "/guarded-class",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ data: "class-guarded" });

      await module.close();
    });

    it("should block all routes when auth header is missing", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [ClassGuardedController],
      }).compile();

      const res = await module.inject({ method: "GET", url: "/guarded-class" });
      expect(res.statusCode).toBe(403);

      const res2 = await module.inject({ method: "GET", url: "/guarded-class/other" });
      expect(res2.statusCode).toBe(403);

      await module.close();
    });
  });

  describe("@UseGuard on method level", () => {
    it("should apply guard only to the decorated method", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [MethodGuardedController],
      }).compile();

      // Public route - no guard
      const publicRes = await module.inject({ method: "GET", url: "/guarded-method/public" });
      expect(publicRes.statusCode).toBe(200);
      expect(publicRes.body).toEqual({ data: "public" });

      // Private route - guarded, no auth
      const privateRes = await module.inject({ method: "GET", url: "/guarded-method/private" });
      expect(privateRes.statusCode).toBe(403);

      // Private route - guarded, with auth
      const authedRes = await module.inject({
        method: "GET",
        url: "/guarded-method/private",
        headers: { authorization: "Bearer valid-token" },
      });
      expect(authedRes.statusCode).toBe(200);
      expect(authedRes.body).toEqual({ data: "private" });

      await module.close();
    });
  });

  describe("Multiple guards", () => {
    it("should require all guards to pass", async () => {
      const module = await TestingHttpFactory.create({
        controllers: [MultiGuardController],
      }).compile();

      // Only first guard passes
      const res1 = await module.inject({
        method: "GET",
        url: "/multi-guard",
        headers: { authorization: "Bearer valid-token" },
      });
      expect(res1.statusCode).toBe(403);

      // Only second guard passes
      const res2 = await module.inject({
        method: "GET",
        url: "/multi-guard",
        headers: { "x-second": "pass" },
      });
      expect(res2.statusCode).toBe(403);

      // Both guards pass
      const res3 = await module.inject({
        method: "GET",
        url: "/multi-guard",
        headers: { authorization: "Bearer valid-token", "x-second": "pass" },
      });
      expect(res3.statusCode).toBe(200);
      expect(res3.body).toEqual({ data: "multi-guarded" });

      await module.close();
    });
  });

  describe("Guard with DI injection", () => {
    it("should resolve guard from DI container", async () => {
      @Injectable()
      class ConfigService {
        getApiKey() {
          return "secret-key";
        }
      }

      @Injectable()
      class ApiKeyGuard implements Guard {
        constructor(private config: ConfigService) {}

        canActivate(context: ExecutionContext): boolean {
          const http = context.switchToHttp();
          const req = http.getRequest();
          return req.headers["x-api-key"] === this.config.getApiKey();
        }
      }

      @Controller("/api-guarded")
      @UseGuard(ApiKeyGuard)
      class ApiGuardedController {
        @Http.Get("/")
        getData() {
          return { data: "api-guarded" };
        }
      }

      const module = await TestingHttpFactory.create({
        controllers: [ApiGuardedController],
        packs: [
          {
            name: "TestPack",
            providers: [
              { token: ConfigService, useClass: ConfigService },
              { token: ApiKeyGuard, useClass: ApiKeyGuard },
            ],
          },
        ],
      }).compile();

      // Without API key
      const res1 = await module.inject({ method: "GET", url: "/api-guarded" });
      expect(res1.statusCode).toBe(403);

      // With correct API key
      const res2 = await module.inject({
        method: "GET",
        url: "/api-guarded",
        headers: { "x-api-key": "secret-key" },
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.body).toEqual({ data: "api-guarded" });

      await module.close();
    });
  });
});
