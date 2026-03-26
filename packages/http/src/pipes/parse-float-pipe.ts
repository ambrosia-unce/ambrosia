/**
 * ParseFloatPipe - transforms string to float
 */

import { Injectable } from "@ambrosia-unce/core";
import { BadRequestException } from "../exceptions/built-in-exceptions.ts";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * ParseFloatPipe
 *
 * Transforms string value to floating-point number
 * Throws BadRequestException if value is not a valid float
 *
 * @example
 * ```typescript
 * @Controller('/products')
 * export class ProductController {
 *   @Get('/:price')
 *   getByPrice(@Param('price', ParseFloatPipe) price: number) {
 *     // price is guaranteed to be a number
 *   }
 * }
 * ```
 */
@Injectable()
export class ParseFloatPipe implements Pipe<string, number> {
  transform(value: string, metadata?: PipeMetadata): number {
    const val = parseFloat(value);

    if (isNaN(val)) {
      throw new BadRequestException(`Validation failed: "${value}" is not a valid float`);
    }

    return val;
  }
}
