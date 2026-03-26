/**
 * @Serialize() decorator - specifies a DTO class for response serialization
 */

import type { Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @Serialize() decorator
 *
 * Specifies a DTO class for response serialization.
 * Used together with SerializeInterceptor.
 *
 * The DTO class should have either:
 * - A static `serialize(data)` method for custom transformation
 * - A static `excludeFields` array for field exclusion
 *
 * @example
 * ```ts
 * class UserResponseDto {
 *   static excludeFields = ['password', 'internalId'];
 * }
 *
 * @Controller('/users')
 * @UseInterceptor(SerializeInterceptor)
 * export class UserController {
 *   @Get('/:id')
 *   @Serialize(UserResponseDto)
 *   getUser(@Param('id') id: string) {
 *     return this.userService.findOne(id); // password will be excluded
 *   }
 * }
 * ```
 */
export function Serialize(dtoClass: Constructor): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.setSerialize(constructor, propertyKey, dtoClass);
    return descriptor;
  };
}
