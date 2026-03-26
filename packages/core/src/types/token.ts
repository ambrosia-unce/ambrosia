/**
 * Type-safe injection token for non-class dependencies
 *
 * Used for injecting interfaces, primitives, or any type that cannot be used as a class token.
 *
 * @example
 * ```typescript
 * const CONFIG_TOKEN = new InjectionToken<AppConfig>('AppConfig');
 * container.registerValue(CONFIG_TOKEN, { apiUrl: 'https://api.example.com' });
 *
 * class ApiClient {
 *   constructor(@Inject(CONFIG_TOKEN) private config: AppConfig) {}
 * }
 * ```
 */
export class InjectionToken<_T = any> {
  /**
   * Create a new injection token
   * @param description Human-readable description for debugging
   */
  constructor(public readonly description: string) {}

  /**
   * String representation for debugging
   */
  toString(): string {
    return `InjectionToken(${this.description})`;
  }

  /**
   * Symbol representation for unique identity
   */
  toJSON(): string {
    return this.toString();
  }
}
