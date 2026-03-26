/**
 * @Inject decorator
 *
 * Explicitly specifies the injection token for a constructor parameter.
 * Useful when:
 * - Injecting interfaces (via InjectionToken)
 * - Injecting abstract classes
 * - Overriding the reflected type
 *
 * @example
 * ```typescript
 * const CONFIG = new InjectionToken<AppConfig>('AppConfig');
 *
 * @Injectable()
 * class ApiService {
 *   constructor(@Inject(CONFIG) private config: AppConfig) {}
 * }
 * ```
 */

import { MetadataManager } from "../metadata/metadata-manager.ts";
import type { Constructor, Token } from "../types/common.ts";
import type { InjectMetadata } from "../types/metadata.ts";

/**
 * @Inject() decorator
 *
 * Marks a constructor parameter for injection with an explicit token.
 * This overrides TypeScript's reflected type information.
 *
 * @param token The token to inject
 * @returns Parameter decorator
 *
 * @example
 * Injecting a configuration token:
 * ```typescript
 * const API_CONFIG = new InjectionToken<ApiConfig>('ApiConfig');
 *
 * @Injectable()
 * class ApiClient {
 *   constructor(@Inject(API_CONFIG) private config: ApiConfig) {}
 * }
 * ```
 *
 * @example
 * Injecting an abstract class:
 * ```typescript
 * abstract class Logger {
 *   abstract log(message: string): void;
 * }
 *
 * @Injectable()
 * class AppService {
 *   constructor(@Inject(Logger) private logger: Logger) {}
 * }
 * ```
 */
export function Inject(token: Token): ParameterDecorator {
  return (
    target: Object,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ): void => {
    const constructor = target as Constructor;

    // Store inject metadata
    const metadata: InjectMetadata = {
      token,
      parameterIndex,
    };

    MetadataManager.addInject(constructor, metadata);
  };
}
