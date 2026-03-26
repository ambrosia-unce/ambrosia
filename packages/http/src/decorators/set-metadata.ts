/**
 * SetMetadata and @Public decorators for custom metadata
 */

import type { Constructor } from "@ambrosia/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * SetMetadata helper
 *
 * Sets custom metadata on a class or method.
 * Guards and interceptors can read this via ExecutionContext.getMetadata().
 *
 * @example
 * ```ts
 * const Roles = (...roles: string[]) => SetMetadata('roles', roles);
 *
 * @Controller('/admin')
 * @Roles('admin')
 * export class AdminController {
 *   @Get('/')
 *   @Roles('superadmin')
 *   dashboard() { }
 * }
 * ```
 */
export function SetMetadata(key: string, value: any): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const constructor = propertyKey ? target.constructor : target;
    HttpMetadataManager.setCustomMetadata(constructor, propertyKey, key, value);
    return (descriptor || target) as any;
  };
}

/**
 * IS_PUBLIC metadata key used by @Public() decorator
 */
export const IS_PUBLIC_KEY = "isPublic";

/**
 * @Public() decorator
 *
 * Marks a route or controller as publicly accessible.
 * Guards should check for this metadata and skip authentication if present.
 *
 * @example
 * ```ts
 * @Controller('/api')
 * @UseGuard(AuthGuard)
 * export class ApiController {
 *   @Get('/health')
 *   @Public()
 *   health() {
 *     return { ok: true };
 *   }
 *
 *   @Get('/protected')
 *   protectedRoute() {
 *     return { secret: 'data' };
 *   }
 * }
 *
 * // In AuthGuard:
 * @Injectable()
 * class AuthGuard implements Guard {
 *   canActivate(context: ExecutionContext) {
 *     const isPublic = context.getMetadata(IS_PUBLIC_KEY);
 *     if (isPublic) return true;
 *     // ... check auth
 *   }
 * }
 * ```
 */
export function Public(): ClassDecorator & MethodDecorator {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
