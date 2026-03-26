export function authGuard(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Guard, ExecutionContext } from "@ambrosia-unce/http";
import { UnauthorizedException } from "@ambrosia-unce/http";

/**
 * Example authentication guard.
 * Replace the token validation logic with your own (JWT, session, etc.).
 */
@Injectable()
export class AuthGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers["authorization"];

    if (!token) {
      throw new UnauthorizedException("Missing authorization header");
    }

    // TODO: Replace with real token validation
    // const user = await this.authService.validateToken(token);
    // context.setMetadata("user", user);

    return true;
  }
}
`;
}

export function loggingInterceptor(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Interceptor, ExecutionContext, CallHandler } from "@ambrosia-unce/http";

/**
 * Logs request method, path, and execution time.
 */
@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const start = performance.now();

    const result = await next.handle();

    const duration = (performance.now() - start).toFixed(2);
    console.log(\`[\${method}] \${path} - \${duration}ms\`);

    return result;
  }
}
`;
}

export function httpExceptionFilter(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { ExceptionFilter, ExceptionFilterArgs } from "@ambrosia-unce/http";
import { HttpException } from "@ambrosia-unce/http";

/**
 * Catches HttpException and returns a structured JSON error response.
 */
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs) {
    const { exception } = args;

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.getMessage(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode: 500,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    };
  }
}
`;
}

export function corsMiddleware(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Middleware, IHttpRequest, IHttpResponse } from "@ambrosia-unce/http";

/**
 * Simple CORS middleware.
 * For production, consider using a dedicated CORS plugin for your HTTP provider.
 */
@Injectable()
export class CorsMiddleware implements Middleware {
  async use(req: IHttpRequest, res: IHttpResponse, next: () => Promise<void>) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    await next();
  }
}
`;
}
