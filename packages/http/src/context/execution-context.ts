/**
 * ExecutionContext for Guards and Interceptors
 *
 * Provides rich metadata about the current HTTP request execution
 */

import type { Constructor } from "@ambrosia/core";
import type { IHttpRequest, IHttpResponse } from "../types/common.ts";
import type { HttpContext } from "./http-context.ts";

/**
 * ExecutionContext interface
 *
 * Passed to Guards and Interceptors to provide request context
 * and metadata about the handler being executed
 */
export interface ExecutionContext {
  /**
   * Get the HTTP context (request/response wrapper)
   */
  getHttpContext(): HttpContext;

  /**
   * Get the controller class constructor
   */
  getClass(): Constructor;

  /**
   * Get the handler method name
   */
  getHandler(): string | symbol;

  /**
   * Get handler arguments (after parameter resolution)
   */
  getArgs(): any[];

  /**
   * Get custom metadata value by key
   */
  getMetadata<T = any>(key: string): T | undefined;

  /**
   * Set custom metadata value
   */
  setMetadata<T = any>(key: string, value: T): void;

  /**
   * Switch to HTTP context for type narrowing
   *
   * @returns Object with getters for request, response, and context
   */
  switchToHttp(): {
    getRequest(): IHttpRequest;
    getResponse(): IHttpResponse;
    getContext(): HttpContext;
  };
}

/**
 * ExecutionContext implementation
 */
export class ExecutionContextImpl implements ExecutionContext {
  constructor(
    private httpContext: HttpContext,
    private controllerClass: Constructor,
    private handlerName: string | symbol,
    public args: any[],
  ) {}

  getHttpContext(): HttpContext {
    return this.httpContext;
  }

  getClass(): Constructor {
    return this.controllerClass;
  }

  getHandler(): string | symbol {
    return this.handlerName;
  }

  getArgs(): any[] {
    return this.args;
  }

  getMetadata<T = any>(key: string): T | undefined {
    return this.httpContext.get<T>(key);
  }

  setMetadata<T = any>(key: string, value: T): void {
    this.httpContext.set(key, value);
  }

  switchToHttp() {
    return {
      getRequest: () => this.httpContext.request,
      getResponse: () => this.httpContext.response,
      getContext: () => this.httpContext,
    };
  }
}
