/**
 * TestingHttpFactory - creates HTTP applications with a mock provider for testing
 */

import type { Constructor, Token } from "@ambrosia/core";
import { HttpApplication, type HttpApplicationOptions } from "../application/http-application.ts";
import type { HttpProvider, RouteConfig } from "../providers/http-provider.interface.ts";
import { PathMatcher } from "../routing/path-matcher.ts";
import type { HttpMethod } from "../types/common.ts";
import { createMockHttpContext } from "./mock-helpers.ts";

/**
 * MockHttpProvider - captures registered routes for testing
 */
class MockHttpProvider implements HttpProvider<any, any> {
  readonly name = "mock";
  private routes: RouteConfig[] = [];

  getNativeApp(): any {
    return {};
  }

  registerRoute(config: RouteConfig): void {
    this.routes.push(config);
  }

  use(_middleware: any): void {}

  async listen(_port: number): Promise<void> {}

  findRoute(
    method: HttpMethod,
    path: string,
  ): { route: RouteConfig; params: Record<string, string> } | undefined {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const params = PathMatcher.extractParams(route.path, path);
      if (params !== null) {
        return { route, params };
      }
      // Exact match fallback
      if (route.path === path) {
        return { route, params: {} };
      }
    }
    return undefined;
  }

  getRoutes(): RouteConfig[] {
    return this.routes;
  }
}

/**
 * Options for inject()
 */
export interface InjectOptions {
  method: HttpMethod;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Response from inject()
 */
export interface InjectResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * TestingHttpFactory
 *
 * Creates an HttpApplication with a mock provider for testing.
 * Allows simulating HTTP requests without starting a real server.
 *
 * @example
 * ```typescript
 * const module = await TestingHttpFactory
 *   .create({ packs: [UserPack], controllers: [HealthController] })
 *   .overrideValue(DB_TOKEN, mockDb)
 *   .compile();
 *
 * const res = await module.inject({ method: 'GET', url: '/users/1' });
 * expect(res.statusCode).toBe(200);
 * expect(res.body.data.name).toBe('Alice');
 *
 * await module.close();
 * ```
 */
export class TestingHttpFactory {
  private _options: Omit<HttpApplicationOptions, "provider">;
  private overrides: Array<{ token: Token; type: "class" | "value"; value: any }> = [];

  private constructor(options: Omit<HttpApplicationOptions, "provider">) {
    this._options = options;
  }

  static create(options: Omit<HttpApplicationOptions, "provider">): TestingHttpFactory {
    return new TestingHttpFactory(options);
  }

  override<T>(token: Token<T>, useClass: Constructor<T>): this {
    this.overrides.push({ token, type: "class", value: useClass });
    return this;
  }

  overrideValue<T>(token: Token<T>, value: T): this {
    this.overrides.push({ token, type: "value", value });
    return this;
  }

  async compile(): Promise<TestingHttpModule> {
    const app = await HttpApplication.create({
      ...this._options,
      provider: MockHttpProvider as any,
    });

    // Apply overrides to container
    const container = app.getContainer();
    for (const override of this.overrides) {
      if (override.type === "value") {
        container.register({ token: override.token, useValue: override.value });
      } else {
        container.register({ token: override.token, useClass: override.value });
      }
    }

    return new TestingHttpModule(app);
  }
}

/**
 * TestingHttpModule - compiled test module with inject() support
 */
export class TestingHttpModule {
  constructor(private app: HttpApplication) {}

  /**
   * Simulate an HTTP request through the full lifecycle pipeline
   */
  async inject(options: InjectOptions): Promise<InjectResponse> {
    const provider = this.app.getProvider() as unknown as MockHttpProvider;

    // Parse URL to separate path and query
    let path: string;
    let queryFromUrl: Record<string, string> = {};
    try {
      const urlObj = new URL(options.url, "http://localhost");
      path = urlObj.pathname;
      queryFromUrl = Object.fromEntries(urlObj.searchParams);
    } catch {
      path = options.url;
    }

    // Find matching route
    const match = provider.findRoute(options.method, path);
    if (!match) {
      return {
        statusCode: 404,
        headers: {},
        body: { statusCode: 404, error: "Not Found", message: `Cannot ${options.method} ${path}` },
      };
    }

    // Create mock HttpContext
    const query = { ...queryFromUrl, ...(options.query || {}) };
    const httpContext = createMockHttpContext({
      method: options.method,
      url: options.url,
      path,
      body: options.body,
      headers: options.headers || {},
      params: match.params,
      query,
    });

    // Execute route handler (full lifecycle pipeline)
    try {
      const result = await match.route.handler(httpContext);
      return {
        statusCode: httpContext.response.status,
        headers: httpContext.response.headers,
        body: result,
      };
    } catch (error: any) {
      return {
        statusCode: error?.getStatus?.() || 500,
        headers: httpContext.response.headers,
        body: {
          statusCode: error?.getStatus?.() || 500,
          error: error?.name || "Error",
          message: error?.message || "Internal Server Error",
        },
      };
    }
  }

  /**
   * Get a service from the DI container
   */
  get<T extends object>(token: Token<T>): T {
    return this.app.getContainer().resolve(token);
  }

  /**
   * Get the underlying HttpApplication
   */
  getApp(): HttpApplication {
    return this.app;
  }

  /**
   * Close the test module and clean up resources
   */
  async close(): Promise<void> {
    await this.app.close();
  }
}
