/**
 * ParseBoolPipe - transforms string to boolean
 */

import { Injectable } from "@ambrosia-unce/core";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * ParseBoolPipe
 *
 * Transforms string value to boolean
 * Accepts: 'true', 'false', '1', '0'
 * Throws BadRequestException if value is not a valid boolean
 *
 * @example
 * ```typescript
 * @Controller('/posts')
 * export class PostController {
 *   @Get('/')
 *   list(@Query('published', ParseBoolPipe) published: boolean) {
 *     // published is guaranteed to be a boolean
 *   }
 * }
 * ```
 */
@Injectable()
export class ParseBoolPipe implements Pipe<string, boolean> {
  transform(value: string, metadata?: PipeMetadata): boolean {
    if (value === "true" || value === "1") {
      return true;
    }

    if (value === "false" || value === "0") {
      return false;
    }

    throw new BadRequestException(
      `Validation failed: "${value}" is not a valid boolean (expected 'true', 'false', '1', or '0')`,
    );
  }
}
