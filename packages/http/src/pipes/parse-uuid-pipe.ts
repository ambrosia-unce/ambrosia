/**
 * ParseUUIDPipe - validates UUID v4 format
 */

import { Injectable } from "@ambrosia/core";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ParseUUIDPipe
 *
 * Validates that a string is a valid UUID v4
 * Throws BadRequestException if value is not a valid UUID
 *
 * @example
 * ```typescript
 * @Controller('/resources')
 * export class ResourceController {
 *   @Get('/:id')
 *   getById(@Param('id', ParseUUIDPipe) id: string) {
 *     // id is guaranteed to be a valid UUID v4
 *   }
 * }
 * ```
 */
@Injectable()
export class ParseUUIDPipe implements Pipe<string, string> {
  transform(value: string, metadata?: PipeMetadata): string {
    if (!UUID_V4_REGEX.test(value)) {
      throw new BadRequestException(`Validation failed: "${value}" is not a valid UUID (v4)`);
    }

    return value;
  }
}
