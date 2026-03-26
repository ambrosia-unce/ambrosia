/**
 * @Injectable decorator
 *
 * Marks a class as injectable and automatically registers it with the DI container.
 * This is the primary decorator for enabling dependency injection.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(private db: Database) {}
 * }
 *
 * @Injectable({ scope: Scope.TRANSIENT })
 * class RequestHandler {
 *   // ...
 * }
 * ```
 */

import { getRegistry } from "../container/registry.ts";
import { MetadataManager } from "../metadata/metadata-manager.ts";
import { DEFAULT_SCOPE, type Scope } from "../scope/types.ts";
import type { Constructor } from "../types/common.ts";
import type { InjectableMetadata } from "../types/metadata.ts";

/**
 * Injectable decorator options
 */
export interface InjectableOptions {
  /**
   * Lifecycle scope for the injectable
   *
   * - SINGLETON (default): One instance shared across the application
   * - TRANSIENT: New instance created for every injection
   * - REQUEST: One instance per request context
   */
  scope?: Scope;
}

/**
 * @Injectable() decorator
 *
 * Marks a class as injectable and registers it with the global Registry.
 * The class can then be resolved by the Container with automatic dependency injection.
 *
 * @param options Optional configuration
 * @returns Class decorator
 *
 * @example
 * Basic usage:
 * ```typescript
 * @Injectable()
 * class Database {
 *   connect() { ... }
 * }
 * ```
 *
 * @example
 * With custom scope:
 * ```typescript
 * @Injectable({ scope: Scope.TRANSIENT })
 * class RequestHandler {
 *   handle(req: Request) { ... }
 * }
 * ```
 *
 * @example
 * With constructor injection:
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(
 *     private db: Database,
 *     private logger: Logger
 *   ) {}
 * }
 * ```
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return <T extends Function>(target: T): T => {
    const constructor = target as unknown as Constructor;

    // Extract scope from options (default to SINGLETON)
    const scope = options.scope || DEFAULT_SCOPE;

    // Store metadata on the class
    const metadata: InjectableMetadata = {
      scope,
      token: constructor,
    };
    MetadataManager.setInjectable(constructor, metadata);

    // Auto-register with the global Registry
    const registry = getRegistry();
    registry.registerProvider({
      token: constructor,
      useClass: constructor,
      scope,
    });

    return target;
  };
}
