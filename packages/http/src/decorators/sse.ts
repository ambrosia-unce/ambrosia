/**
 * @Sse() decorator - marks a route handler as SSE endpoint
 */

import type { Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @Sse() decorator
 *
 * Marks a route handler as a Server-Sent Events endpoint.
 * The handler should return an SseStream instance.
 *
 * @example
 * ```ts
 * @Controller('/events')
 * export class EventsController {
 *   @Get('/')
 *   @Sse()
 *   stream() {
 *     const stream = new SseStream();
 *     setInterval(() => {
 *       stream.send({ data: { time: Date.now() } });
 *     }, 1000);
 *     return stream;
 *   }
 * }
 * ```
 */
export function Sse(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor as Constructor;
    HttpMetadataManager.setSse(constructor, propertyKey);
    return descriptor;
  };
}
