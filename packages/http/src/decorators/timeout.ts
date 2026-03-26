/**
 * @Timeout() decorator - sets a timeout for the route handler
 */

import type { Constructor } from "@ambrosia/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @Timeout() decorator
 *
 * Sets a timeout for the route handler in milliseconds.
 * If the handler does not complete within the timeout,
 * a RequestTimeoutException (408) is thrown.
 *
 * @example
 * ```ts
 * @Controller('/api')
 * export class ApiController {
 *   @Get('/slow')
 *   @Timeout(5000)
 *   slowOperation() {
 *     // If this takes more than 5 seconds, 408 is returned
 *   }
 * }
 * ```
 */
export function Timeout(ms: number): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.setTimeout(constructor, propertyKey, ms);
    return descriptor;
  };
}
