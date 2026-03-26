/**
 * ParseIntPipe - transforms string to integer
 */

import { Injectable } from "@ambrosia/core";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * ParseIntPipe
 *
 * Transforms string value to integer
 * Throws BadRequestException if value is not a valid integer
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/:id')
 *   getUser(@Param('id', ParseIntPipe) id: number) {
 *     // id is guaranteed to be a number
 *   }
 * }
 * ```
 */
@Injectable()
export class ParseIntPipe implements Pipe<string, number> {
  transform(value: string, metadata?: PipeMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(`Validation failed: "${value}" is not a valid integer`);
    }

    if (!Number.isSafeInteger(val)) {
      throw new BadRequestException(`Validation failed: "${value}" is outside safe integer range`);
    }

    return val;
  }
}
