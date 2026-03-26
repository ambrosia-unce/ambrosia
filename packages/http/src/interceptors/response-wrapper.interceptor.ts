/**
 * ResponseWrapperInterceptor - wraps responses in a standard envelope
 */

import { Injectable } from "@ambrosia/core";
import type { CallHandler } from "../context/call-handler.ts";
import type { ExecutionContext } from "../context/execution-context.ts";
import type { Interceptor } from "./interceptor.interface.ts";

/**
 * ResponseWrapperInterceptor
 *
 * Wraps handler results in a standardized response envelope:
 * `{ data, meta, statusCode }`
 *
 * Skips wrapping for null/undefined results and already-wrapped responses.
 *
 * @example
 * ```typescript
 * // Register globally
 * const app = await HttpApplication.create({
 *   provider: ElysiaProvider,
 *   globalInterceptors: [ResponseWrapperInterceptor],
 *   packs: [UserPack],
 * });
 *
 * // GET /users/1 returns:
 * // { data: { id: 1, name: "Alice" }, meta: { timestamp: "..." }, statusCode: 200 }
 * ```
 */
@Injectable()
export class ResponseWrapperInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    // Don't wrap null/undefined (e.g., 204 No Content)
    if (result === null || result === undefined) {
      return result;
    }

    // Don't double-wrap if already in envelope format
    if (result && typeof result === "object" && "data" in result && "statusCode" in result) {
      return result;
    }

    const httpContext = context.getHttpContext();
    const statusCode = httpContext.response.status || 200;

    return {
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
      statusCode,
    };
  }
}
