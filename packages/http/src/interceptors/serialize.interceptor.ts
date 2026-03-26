/**
 * SerializeInterceptor - transforms responses based on DTO class metadata
 */

import { Injectable } from "@ambrosia/core";
import type { CallHandler } from "../context/call-handler.ts";
import type { ExecutionContext } from "../context/execution-context.ts";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";
import type { Interceptor } from "./interceptor.interface.ts";

/**
 * SerializeInterceptor
 *
 * Transforms response data based on DTO class metadata from @Serialize().
 * The DTO class should have either:
 * - A static `serialize(data)` method for custom transformation
 * - A static `excludeFields: string[]` array for field exclusion
 *
 * @example
 * ```typescript
 * class UserResponse {
 *   static excludeFields = ['password', 'salt'];
 * }
 *
 * @Controller('/users')
 * @UseInterceptor(SerializeInterceptor)
 * export class UserController {
 *   @Get('/:id')
 *   @Serialize(UserResponse)
 *   getUser(@Param('id') id: string) {
 *     return this.userService.findOne(id);
 *   }
 * }
 * ```
 */
@Injectable()
export class SerializeInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    const controllerClass = context.getClass();
    const handlerName = context.getHandler();
    const dtoClass = HttpMetadataManager.getSerialize(controllerClass, handlerName);

    if (!dtoClass) {
      return result;
    }

    // Check for static serialize method
    if (typeof (dtoClass as any).serialize === "function") {
      return (dtoClass as any).serialize(result);
    }

    // Check for static excludeFields
    if (Array.isArray((dtoClass as any).excludeFields)) {
      return SerializeInterceptor.excludeFields(result, (dtoClass as any).excludeFields);
    }

    return result;
  }

  private static excludeFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map((item) => SerializeInterceptor.excludeFields(item, fields));
    }
    if (data && typeof data === "object") {
      const result = { ...data };
      for (const field of fields) {
        delete result[field];
      }
      return result;
    }
    return data;
  }
}
