/**
 * Response decorators for setting status codes and headers
 */

import type { Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @Status() decorator
 *
 * Set HTTP status code for the response
 * Applied at method level
 *
 * @example
 * ```ts
 * @Controller('/users')
 * export class UserController {
 *   @Post('/')
 *   @Status(201)
 *   create(@Body() dto: CreateUserDto) {
 *     return this.userService.create(dto);
 *   }
 *
 *   @Delete('/:id')
 *   @Status(204)
 *   remove(@Param('id') id: string) {
 *     return this.userService.delete(id);
 *   }
 * }
 * ```
 */
export function Status(code: number): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.setResponseStatus(constructor, propertyKey, code);
    return descriptor;
  };
}

/**
 * @SetHeader() decorator
 *
 * Set a response header for the route.
 * Can be applied multiple times to set multiple headers.
 *
 * Named SetHeader to avoid collision with @Header() parameter decorator.
 *
 * @example
 * ```ts
 * @Controller('/api')
 * export class ApiController {
 *   @Get('/data')
 *   @SetHeader('Cache-Control', 'no-cache')
 *   @SetHeader('X-Custom', 'value')
 *   getData() {
 *     return { data: 'hello' };
 *   }
 * }
 * ```
 */
export function SetHeader(name: string, value: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.addResponseHeader(constructor, propertyKey, name, value);
    return descriptor;
  };
}

/**
 * @Redirect() decorator
 *
 * Redirect to specified URL with optional status code (default 302).
 * If the handler returns a string, it overrides the decorator URL.
 *
 * @example
 * ```ts
 * @Controller('/legacy')
 * export class LegacyController {
 *   @Get('/old-page')
 *   @Redirect('/new-page', 301)
 *   oldPage() {}
 *
 *   @Get('/dynamic')
 *   @Redirect('/fallback')
 *   dynamicRedirect() {
 *     // Return string to override redirect URL
 *     return '/custom-url';
 *   }
 * }
 * ```
 */
export function Redirect(url: string, statusCode: number = 302): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.setRedirect(constructor, propertyKey, url, statusCode);
    return descriptor;
  };
}
