/**
 * Lifecycle decorators for Guards, Interceptors, Pipes, and Middleware
 *
 * These decorators can be applied at class or method level
 */

import type { Constructor } from "@ambrosia/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @UseGuard() decorator
 *
 * Apply guards to controller (all methods) or specific method
 * Guards execute before interceptors and validate if request can proceed
 *
 * @example
 * ```ts
 * @Controller('/users')
 * @UseGuard(AuthGuard)
 * export class UserController {
 *   @Get('/:id')
 *   @UseGuard(RoleGuard)
 *   getUser(@Param('id') id: string) { }
 * }
 * ```
 */
export function UseGuard(...guards: Constructor[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;

    for (const guard of guards) {
      HttpMetadataManager.addGuard(constructor, propertyKey, guard);
    }

    return descriptor || target;
  };
}

/**
 * @UseInterceptor() decorator
 *
 * Apply interceptors to controller (all methods) or specific method
 * Interceptors can transform request/response and execute before/after handler
 *
 * @example
 * ```ts
 * @Controller('/posts')
 * @UseInterceptor(LoggingInterceptor)
 * export class PostController {
 *   @Post('/')
 *   @UseInterceptor(TransformInterceptor)
 *   create(@Body() dto: CreatePostDto) { }
 * }
 * ```
 */
export function UseInterceptor(...interceptors: Constructor[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;

    for (const interceptor of interceptors) {
      HttpMetadataManager.addInterceptor(constructor, propertyKey, interceptor);
    }

    return descriptor || target;
  };
}

/**
 * @UsePipe() decorator
 *
 * Apply pipes to controller (all methods) or specific method
 * Pipes transform and validate parameter values
 *
 * @example
 * ```ts
 * @Controller('/products')
 * @UsePipe(ValidationPipe)
 * export class ProductController {
 *   @Get('/:id')
 *   @UsePipe(ParseIntPipe)
 *   getProduct(@Param('id') id: number) { }
 * }
 * ```
 */
export function UsePipe(...pipes: Constructor[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;

    for (const pipe of pipes) {
      HttpMetadataManager.addPipe(constructor, propertyKey, pipe);
    }

    return descriptor || target;
  };
}

/**
 * @UseMiddleware() decorator
 *
 * Apply middleware to controller (all methods) or specific method.
 * Accepts both class-based and functional middleware.
 * Middleware executes before guards in the request lifecycle.
 *
 * @example
 * ```ts
 * @Controller('/admin')
 * @UseMiddleware(CorsMiddleware)
 * export class AdminController {
 *   @Get('/dashboard')
 *   @UseMiddleware(async (req, res, next) => {
 *     console.log('Dashboard accessed');
 *     await next();
 *   })
 *   getDashboard() { }
 * }
 * ```
 */
export function UseMiddleware(...middleware: any[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;

    for (const mw of middleware) {
      HttpMetadataManager.addMiddleware(constructor, mw, propertyKey);
    }

    return (descriptor || target) as any;
  };
}

/**
 * @UseFilter() decorator
 *
 * Apply exception filters to controller (all methods) or specific method
 * Filters handle exceptions thrown during request processing
 *
 * @example
 * ```ts
 * @Controller('/api')
 * @UseFilter(HttpExceptionFilter)
 * export class ApiController {
 *   @Post('/data')
 *   @UseFilter(ValidationExceptionFilter)
 *   processData(@Body() data: any) { }
 * }
 * ```
 */
export function UseFilter(...filters: Constructor[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;

    for (const filter of filters) {
      HttpMetadataManager.addFilter(constructor, propertyKey, filter);
    }

    return descriptor || target;
  };
}
