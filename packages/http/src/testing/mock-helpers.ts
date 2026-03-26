/**
 * Mock helpers for unit testing guards, pipes, interceptors
 */

import type { Constructor } from "@ambrosia-unce/core";
import type { ExecutionContext } from "../context/execution-context.ts";
import { ExecutionContextImpl } from "../context/execution-context.ts";
import { HttpContext } from "../context/http-context.ts";
import type { HttpMethod, IHttpRequest, IHttpResponse } from "../types/common.ts";

/**
 * Options for creating a mock HttpContext
 */
export interface MockHttpContextOptions {
  method?: HttpMethod;
  url?: string;
  path?: string;
  body?: any;
  headers?: Record<string, string | string[]>;
  query?: Record<string, string | string[]>;
  params?: Record<string, string>;
  cookies?: Record<string, string>;
  ip?: string;
}

/**
 * Create a mock HttpContext for unit testing
 *
 * @example
 * ```typescript
 * const ctx = createMockHttpContext({
 *   method: 'GET',
 *   path: '/users/1',
 *   params: { id: '1' },
 *   headers: { authorization: 'Bearer token' },
 * });
 *
 * // Use in guard tests
 * const guard = new AuthGuard();
 * const result = await guard.canActivate(createMockExecutionContext({ ... }));
 * ```
 */
export function createMockHttpContext(options: MockHttpContextOptions = {}): HttpContext {
  const request: IHttpRequest = {
    method: options.method || "GET",
    url: options.url || "http://localhost/",
    path: options.path || "/",
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || null,
    cookies: options.cookies || {},
    ip: options.ip || "127.0.0.1",
    session: {},
    files: [],
  };

  const responseHeaders: Record<string, string> = {};
  let statusCode = 200;
  let responseBody: any = null;

  const response: IHttpResponse = {
    get status() {
      return statusCode;
    },
    set status(code: number) {
      statusCode = code;
    },
    headers: responseHeaders,
    get body() {
      return responseBody;
    },
    set body(val: any) {
      responseBody = val;
    },
    setStatus(code: number) {
      statusCode = code;
      return response;
    },
    setHeader(name: string, value: string) {
      responseHeaders[name] = value;
      return response;
    },
    json(data: any) {
      responseBody = data;
      return response;
    },
    send(data: any) {
      responseBody = data;
      return response;
    },
    setCookie(_name: string, _value: string) {
      return response;
    },
    redirect(_url: string, status?: number) {
      statusCode = status || 302;
      return response;
    },
  };

  return new HttpContext(request, response, options.params || {}, null);
}

/**
 * Options for creating a mock ExecutionContext
 */
export interface MockExecutionContextOptions extends MockHttpContextOptions {
  controllerClass?: Constructor;
  handlerName?: string | symbol;
  args?: any[];
}

/**
 * Create a mock ExecutionContext for unit testing guards/interceptors
 *
 * @example
 * ```typescript
 * const context = createMockExecutionContext({
 *   method: 'POST',
 *   path: '/users',
 *   body: { name: 'Alice' },
 *   controllerClass: UserController,
 *   handlerName: 'create',
 * });
 *
 * // Test a guard
 * const guard = new RoleGuard();
 * context.setMetadata('roles', ['admin']);
 * const canActivate = await guard.canActivate(context);
 * ```
 */
export function createMockExecutionContext(
  options: MockExecutionContextOptions = {},
): ExecutionContext {
  const httpContext = createMockHttpContext(options);

  const controllerClass =
    options.controllerClass || (class MockController {} as unknown as Constructor);
  const handlerName = options.handlerName || "mockHandler";
  const args = options.args || [];

  return new ExecutionContextImpl(httpContext, controllerClass, handlerName, args);
}
