/**
 * Metadata type definitions for decorators
 */

import type { Scope } from "../scope";
import type { Abstract, Token } from "./common.ts";

/**
 * Metadata stored by @Injectable decorator
 */
export interface InjectableMetadata {
  /** Lifecycle scope for the injectable */
  scope: Scope;
  /** The token used to identify this injectable */
  token: Token;
}

/**
 * Metadata stored by @Implements decorator
 * Maps abstract class to concrete implementation
 */
export interface ImplementsMetadata {
  /** The abstract class this implementation satisfies */
  abstractToken: Abstract<any>;
}

/**
 * Metadata stored by @Inject decorator
 * Specifies explicit injection token for constructor parameter
 */
export interface InjectMetadata {
  /** The token to inject */
  token: Token;
  /** Constructor parameter index */
  parameterIndex: number;
}

/**
 * Metadata stored by @Autowired decorator
 * Used for property injection
 */
export interface AutowiredMetadata {
  /** The token to inject */
  token: Token;
  /** Property key to inject into */
  propertyKey: string | symbol;
  /** Whether this property is optional */
  optional: boolean;
}

/**
 * Metadata stored by @Optional decorator
 * Marks a dependency as optional (won't throw if not found)
 */
export interface OptionalMetadata {
  /** Constructor parameter index (if constructor injection) */
  parameterIndex?: number;
  /** Property key (if property injection) */
  propertyKey?: string | symbol;
}
