import { LoggerService } from "@ambrosia-unce/core";
import { Injectable } from "@ambrosia-unce/core";
import type { CallHandler, ExecutionContext, Interceptor } from "@ambrosia-unce/http";

/**
 * Logging interceptor — logs request method, path, and timing.
 *
 * Demonstrates the interceptor pattern: runs logic before and after
 * the route handler executes.
 */
@Injectable()
export class LoggingInterceptor implements Interceptor {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.child("HTTP");
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const method = request.method;
    const path = request.path;
    const start = performance.now();

    this.logger.info(`${method} ${path}`);

    const result = await next.handle();

    const duration = performance.now() - start;
    this.logger.info(`${method} ${path} completed`, { duration: +duration.toFixed(2) });

    return result;
  }
}
