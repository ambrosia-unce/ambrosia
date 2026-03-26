/**
 * @Catch() decorator - specifies which exception types a filter handles
 */

import type { Constructor } from "@ambrosia/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";

/**
 * @Catch() decorator
 *
 * Applied to ExceptionFilter classes to specify which exception types they handle.
 * Filters without @Catch catch all exceptions (backward compatible).
 * Filters with @Catch only match `exception instanceof Type`.
 *
 * @example
 * ```ts
 * @Catch(NotFoundException)
 * @Injectable()
 * class NotFoundFilter implements ExceptionFilter {
 *   catch({ exception, httpContext }: ExceptionFilterArgs) {
 *     httpContext.response.setStatus(404);
 *     return { error: 'Resource not found', path: httpContext.request.path };
 *   }
 * }
 *
 * @Catch(BadRequestException, UnprocessableEntityException)
 * @Injectable()
 * class ValidationFilter implements ExceptionFilter {
 *   catch({ exception, httpContext }: ExceptionFilterArgs) {
 *     // Handles both BadRequest and UnprocessableEntity
 *   }
 * }
 * ```
 */
export function Catch(...exceptionTypes: Constructor[]): ClassDecorator {
  return (target: any) => {
    HttpMetadataManager.setCatch(target, exceptionTypes);
    return target;
  };
}
