/**
 * ParseEnumPipe - validates value is a member of an enum
 */

import { Injectable } from "@ambrosia/core";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * ParseEnumPipe factory
 *
 * Validates that a string value is a member of the given enum.
 * Returns a pipe class configured for the specific enum type.
 *
 * @example
 * ```typescript
 * enum UserRole {
 *   ADMIN = 'admin',
 *   USER = 'user',
 *   MODERATOR = 'moderator',
 * }
 *
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   listByRole(@Query('role', ParseEnumPipe(UserRole)) role: UserRole) {
 *     // role is guaranteed to be a valid UserRole value
 *   }
 * }
 * ```
 */
export function ParseEnumPipe<T extends Record<string, string | number>>(
  enumType: T,
): new () => Pipe<string, T[keyof T]> {
  const enumValues = Object.values(enumType);

  @Injectable()
  class ParseEnumPipeImpl implements Pipe<string, T[keyof T]> {
    transform(value: string, metadata?: PipeMetadata): T[keyof T] {
      if (!enumValues.includes(value as any)) {
        throw new BadRequestException(
          `Validation failed: "${value}" is not a valid enum value. Allowed: ${enumValues.join(", ")}`,
        );
      }
      return value as unknown as T[keyof T];
    }
  }

  return ParseEnumPipeImpl;
}
