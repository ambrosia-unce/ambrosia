/**
 * DefaultValuePipe - returns default value if input is null/undefined
 */

import { Injectable } from "@ambrosia/core";
import type { Pipe, PipeMetadata } from "./pipe.interface.ts";

/**
 * DefaultValuePipe factory
 *
 * Returns a pipe class that substitutes a default value
 * when the input is null or undefined.
 *
 * @example
 * ```typescript
 * @Controller('/items')
 * export class ItemController {
 *   @Get('/')
 *   list(
 *     @Query('page', DefaultValuePipe('1'), ParseIntPipe) page: number,
 *     @Query('limit', DefaultValuePipe('10'), ParseIntPipe) limit: number,
 *   ) {
 *     // page defaults to '1', limit defaults to '10' if not provided
 *   }
 * }
 * ```
 */
export function DefaultValuePipe<T>(defaultValue: T): new () => Pipe<T | null | undefined, T> {
  @Injectable()
  class DefaultValuePipeImpl implements Pipe<T | null | undefined, T> {
    transform(value: T | null | undefined, metadata?: PipeMetadata): T {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return value;
    }
  }

  return DefaultValuePipeImpl;
}
