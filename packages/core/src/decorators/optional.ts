/**
 * @Optional decorator
 *
 * Marks a dependency as optional. If the provider is not found,
 * undefined will be injected instead of throwing an error.
 *
 * Can be used on:
 * - Constructor parameters
 * - Properties (with @Autowired)
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(
 *     private db: Database,
 *     @Optional() private cache?: CacheService
 *   ) {}
 * }
 * ```
 */

import { MetadataManager } from "../metadata/metadata-manager.ts";
import type { Constructor } from "../types/common.ts";
import type { OptionalMetadata } from "../types/metadata.ts";

/**
 * @Optional() decorator
 *
 * Marks a dependency as optional. Returns undefined if the provider is not found
 * instead of throwing a ProviderNotFoundError.
 *
 * @returns Parameter or Property decorator
 *
 * @example
 * Optional constructor parameter:
 * ```typescript
 * @Injectable()
 * class EmailService {
 *   constructor(
 *     @Optional() private logger?: Logger
 *   ) {
 *     if (this.logger) {
 *       this.logger.log('EmailService initialized');
 *     }
 *   }
 * }
 * ```
 *
 * @example
 * Optional property injection:
 * ```typescript
 * @Injectable()
 * class UserController {
 *   @Autowired()
 *   @Optional()
 *   private cache?: CacheService;
 *
 *   getUser(id: string) {
 *     const cached = this.cache?.get(id);
 *     if (cached) return cached;
 *     // ... fetch from database
 *   }
 * }
 * ```
 */
export function Optional(): ParameterDecorator & PropertyDecorator {
  return (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void => {
    // Parameter decorator: target is the constructor
    // Property decorator: target is the prototype, need target.constructor
    const constructor = (parameterIndex !== undefined ? target : target.constructor) as Constructor;

    const metadata: OptionalMetadata = {
      parameterIndex,
      propertyKey,
    };

    MetadataManager.addOptional(constructor, metadata);
  };
}
