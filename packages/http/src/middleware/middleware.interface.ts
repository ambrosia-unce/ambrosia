/**
 * Middleware interface for HTTP request processing
 *
 * Middleware executes before guards in the request lifecycle
 */

import type { Constructor } from "@ambrosia-unce/core";
import type { IHttpRequest, IHttpResponse } from "../types/common.ts";

/**
 * Middleware interface
 *
 * Middleware can:
 * - Modify request/response
 * - Execute logic before route handler
 * - Call next() to continue or skip to end response early
 */
export interface Middleware {
  /**
   * Process middleware logic
   *
   * @param req - HTTP request object
   * @param res - HTTP response object
   * @param next - Function to call next middleware/handler
   */
  use(req: IHttpRequest, res: IHttpResponse, next: () => Promise<void>): Promise<void>;
}

/**
 * Functional middleware type
 *
 * A plain function that acts as middleware without requiring a class.
 *
 * @example
 * ```typescript
 * const corsMiddleware: MiddlewareFunction = async (req, res, next) => {
 *   res.setHeader('Access-Control-Allow-Origin', '*');
 *   await next();
 * };
 *
 * @Controller('/api')
 * @UseMiddleware(corsMiddleware)
 * export class ApiController { }
 * ```
 */
export type MiddlewareFunction = (
  req: IHttpRequest,
  res: IHttpResponse,
  next: () => Promise<void>,
) => Promise<void>;

/**
 * Combined middleware type (class or function)
 */
export type MiddlewareType = Constructor<Middleware> | MiddlewareFunction;
