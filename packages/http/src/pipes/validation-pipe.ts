/**
 * ValidationPipe using TypeBox schemas
 */

import { Injectable } from "@ambrosia/core";
import type { TSchema } from "@sinclair/typebox";
import { TypeBoxValidator } from "../validation/typebox-validator.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * ValidationPipe
 *
 * Automatically validates DTOs decorated with TypeBox schemas
 * Looks for static 'schema' property on DTO class
 *
 * @example
 * ```typescript
 * class CreateUserDto {
 *   static schema = Type.Object({
 *     name: Type.String({ minLength: 1 }),
 *     email: Type.String({ format: 'email' })
 *   });
 *
 *   name!: string;
 *   email!: string;
 * }
 *
 * @Controller('/users')
 * export class UserController {
 *   @Post('/')
 *   create(@Body() dto: CreateUserDto) {
 *     // dto is automatically validated
 *   }
 * }
 * ```
 */
@Injectable()
export class ValidationPipe implements Pipe {
  transform(value: any, metadata?: PipeMetadata): any {
    // If no metadata or type, pass through
    if (!metadata?.type) {
      return value;
    }

    // Check if type has a static schema property
    const type = metadata.type;
    if (typeof type === "function") {
      const schema = (type as any).schema as TSchema | undefined;

      if (schema) {
        // Validate using TypeBox
        return TypeBoxValidator.validate(schema, value);
      }
    }

    // No schema found, pass through without validation
    return value;
  }
}
