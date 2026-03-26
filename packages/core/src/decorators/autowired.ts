/**
 * @Autowired decorator
 *
 * Enables property injection (dependency injection after constructor).
 * Useful for:
 * - Breaking circular dependencies
 * - Optional dependencies
 * - Late-bound dependencies
 *
 * @example
 * ```TypeScript
 * @Injectable()
 * class UserController {
 *   @Autowired()
 *   private logger!: Logger;
 *
 *   @Autowired()
 *   @Optional()
 *   private cache?: CacheService;
 * }
 * ```
 */

import { MetadataError } from "../container/errors.ts";
import { MetadataManager } from "../metadata";
import type { AutowiredMetadata, Constructor, Token } from "../types";

/**
 * @Autowired() decorator
 *
 * Enables property injection. The property will be resolved and injected
 * after the constructor runs.
 *
 * @param token Optional explicit token (if not provided, inferred from property type)
 * @returns Property decorator
 *
 * @example
 * Basic usage (token inferred from type):
 * ```TypeScript
 * @Injectable()
 * class UserService {
 *   @Autowired()
 *   private db!: Database;
 *
 *   @Autowired()
 *   private logger!: Logger;
 * }
 * ```
 *
 * @example
 * With explicit token:
 * ```TypeScript
 * const CACHE_TOKEN = new InjectionToken<ICache>('ICache');
 *
 * @Injectable()
 * class UserService {
 *   @Autowired(CACHE_TOKEN)
 *   private cache!: ICache;
 * }
 * ```
 *
 * @example
 * Breaking circular dependencies:
 * ```TypeScript
 * // Without @Autowired - circular dependency error
 * @Injectable()
 * class A {
 *   constructor(private b: B) {} // Error: A -> B -> A
 * }
 *
 * @Injectable()
 * class B {
 *   constructor(private a: A) {} // Error: B -> A -> B
 * }
 *
 * // With @Autowired - circular dependency broken
 * @Injectable()
 * class A {
 *   @Autowired()
 *   private b!: B; // No error - injected after constructor
 * }
 *
 * @Injectable()
 * class B {
 *   constructor(private a: A) {} // A is constructed first
 * }
 * ```
 *
 * @example
 * Optional property injection:
 * ```TypeScript
 * @Injectable()
 * class EmailService {
 *   @Autowired()
 *   @Optional()
 *   private templateEngine?: TemplateEngine;
 *
 *   send(to: string, subject: string, body: string) {
 *     const formatted = this.templateEngine?.render(body) ?? body;
 *     // ...
 *   }
 * }
 * ```
 */
export function Autowired(token?: Token): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {
    const constructor = target.constructor as Constructor;

    // If token not provided, try to infer from property type metadata
    let resolvedToken = token;
    if (!resolvedToken) {
      const propertyType = MetadataManager.getPropertyType(target, propertyKey);
      if (!propertyType) {
        throw new MetadataError(
          constructor,
          `Cannot infer type for property ${String(propertyKey)}. ` +
            `Either:\n` +
            `  1. Provide an explicit token: @Autowired(MyToken)\n` +
            `  2. Enable emitDecoratorMetadata in tsconfig.json\n` +
            `  3. Ensure the property has a type annotation`,
        );
      }
      resolvedToken = propertyType;
    }

    // Check if this property is marked as @Optional
    const optional = MetadataManager.isPropertyOptional(constructor, propertyKey);

    // Store autowired metadata
    const metadata: AutowiredMetadata = {
      token: resolvedToken,
      propertyKey,
      optional,
    };

    MetadataManager.addAutowired(constructor, metadata);
  };
}
