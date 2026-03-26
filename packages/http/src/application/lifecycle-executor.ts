/**
 * LifecycleExecutor handles the execution pipeline
 *
 * Order: Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Filters
 */

import type { Constructor, Container } from "@ambrosia/core";
import { CallHandlerImpl } from "../context/call-handler.ts";
import type { ExecutionContext } from "../context/execution-context.ts";
import type { ExceptionFilter } from "../filters/exception-filter.interface.ts";
import type { Guard } from "../guards/guard.interface.ts";
import type { Interceptor } from "../interceptors/interceptor.interface.ts";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";
import type { Middleware } from "../middleware/middleware.interface.ts";
import type { Pipe } from "../pipes/pipe.interface.ts";

/**
 * LifecycleExecutor
 *
 * Executes the full HTTP request lifecycle with all components
 */
export class LifecycleExecutor {
  constructor(private container: Container) {}

  /**
   * Execute middleware chain
   *
   * Middleware runs first in the pipeline.
   * Supports both class-based and functional middleware.
   * Each middleware receives a `next` function that invokes the rest of the chain.
   * If a middleware does NOT call `next()`, the chain stops (early response).
   */
  async executeMiddleware(middleware: any[], context: ExecutionContext): Promise<void> {
    if (middleware.length === 0) {
      return;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    // Build chain: each middleware's next() invokes the next middleware in sequence
    const executeAt = (index: number): (() => Promise<void>) => {
      if (index >= middleware.length) {
        return async () => {};
      }
      return async () => {
        const mw = middleware[index];
        const next = executeAt(index + 1);
        if (typeof mw === "function" && !mw.prototype?.use) {
          await mw(req, res, next);
        } else {
          const instance = this.container.resolve(mw) as Middleware;
          await instance.use(req, res, next);
        }
      };
    };

    await executeAt(0)();
  }

  /**
   * Execute guards
   *
   * Guards validate if request can proceed
   * Returns false if any guard denies access
   */
  async executeGuards(guards: Constructor<Guard>[], context: ExecutionContext): Promise<boolean> {
    if (guards.length === 0) {
      return true;
    }

    // Execute guards sequentially
    for (const GuardClass of guards) {
      const guard = this.container.resolve(GuardClass);
      const canActivate = await guard.canActivate(context);

      if (!canActivate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute interceptors
   *
   * Builds a chain of interceptors wrapping the handler
   * Each interceptor can:
   * - Execute logic before handler
   * - Transform handler result
   * - Execute logic after handler
   */
  async executeInterceptors(
    interceptors: Constructor<Interceptor>[],
    context: ExecutionContext,
    handler: () => Promise<any>,
  ): Promise<any> {
    if (interceptors.length === 0) {
      return handler();
    }

    // Build interceptor chain from right to left
    // Last interceptor wraps the handler, then each previous wraps the next
    let next = handler;

    for (let i = interceptors.length - 1; i >= 0; i--) {
      const InterceptorClass = interceptors[i];
      const currentNext = next;

      next = async () => {
        const interceptor = this.container.resolve(InterceptorClass);
        const callHandler = new CallHandlerImpl(currentNext);
        return interceptor.intercept(context, callHandler);
      };
    }

    // Execute the chain
    return next();
  }

  /**
   * Execute pipes on a single argument
   *
   * Pipes transform and validate parameter values
   * Applied sequentially: output of one becomes input of next
   */
  async executePipes(pipes: Constructor<Pipe>[], value: any, metadata?: any): Promise<any> {
    if (pipes.length === 0) {
      return value;
    }

    let result = value;

    // Execute pipes sequentially
    for (const PipeClass of pipes) {
      const pipe = this.container.resolve(PipeClass);
      result = await pipe.transform(result, metadata);
    }

    return result;
  }

  /**
   * Execute exception filters
   *
   * Filters handle exceptions and format error responses.
   * Uses @Catch() decorator metadata for type-based matching:
   * - Filters without @Catch catch all exceptions (backward compatible)
   * - Filters with @Catch(Type) only match `exception instanceof Type`
   */
  async executeFilters(
    filters: Constructor<ExceptionFilter>[],
    exception: any,
    context: ExecutionContext,
  ): Promise<any> {
    if (filters.length === 0) {
      throw exception;
    }

    // Find first matching filter
    for (const FilterClass of filters) {
      const catchTypes = HttpMetadataManager.getCatch(FilterClass);

      // No @Catch decorator or empty types → catches everything
      if (!catchTypes || catchTypes.length === 0) {
        const filter = this.container.resolve(FilterClass);
        return filter.catch({
          exception,
          httpContext: context.getHttpContext(),
        });
      }

      // Check if exception matches any of the caught types
      const matches = catchTypes.some((type) => exception instanceof type);
      if (matches) {
        const filter = this.container.resolve(FilterClass);
        return filter.catch({
          exception,
          httpContext: context.getHttpContext(),
        });
      }
    }

    // No matching filter found — rethrow
    throw exception;
  }
}
