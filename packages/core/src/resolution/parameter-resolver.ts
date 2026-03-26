/**
 * Parameter Resolver - Resolves constructor parameters with dependency injection
 *
 * Combines TypeScript-emitted metadata with decorator metadata to determine
 * what dependencies need to be injected into a constructor.
 */

import { MetadataError } from "../container";
import { MetadataManager } from "../metadata";
import type { Constructor, Token } from "../types";

/**
 * Resolved parameter information
 */
export interface ResolvedParameter {
  /** The token to inject (undefined for optional parameters with no type info) */
  token: Token | undefined;
  /** Whether this parameter is optional */
  optional: boolean;
  /** Parameter index */
  index: number;
}

/**
 * Parameter Resolver class
 * Analyzes constructor parameters and determines injection requirements
 */
export class ParameterResolver {
  /**
   * Cache for resolved parameters to avoid recomputation
   */
  private static cache = new WeakMap<Constructor, ResolvedParameter[]>();

  /**
   * Resolve constructor parameter metadata
   *
   * Combines:
   * 1. TypeScript-emitted parameter types (design:paramtypes)
   * 2. @Inject decorator overrides
   * 3. @Optional decorator markers
   *
   * Results are cached using WeakMap for performance.
   *
   * @param target The class to analyze
   * @returns Array of resolved parameter info
   */
  static resolveParameters(target: Constructor): ResolvedParameter[] {
    // Check cache first
    const cached = ParameterResolver.cache.get(target);
    if (cached) {
      return cached;
    }

    // Resolve parameters
    const resolved = ParameterResolver.resolveParametersInternal(target);

    // Cache the result
    ParameterResolver.cache.set(target, resolved);

    return resolved;
  }

  /**
   * Internal method that performs the actual parameter resolution
   *
   * @param target The class to analyze
   * @returns Array of resolved parameter info
   */
  private static resolveParametersInternal(target: Constructor): ResolvedParameter[] {
    // 1. Get parameter types from TypeScript metadata
    const paramTypes = MetadataManager.getParamTypes(target) || [];

    if (paramTypes.length === 0) {
      // No constructor parameters
      return [];
    }

    // 2. Get @Inject overrides (explicit token specifications)
    const injects = MetadataManager.getInjects(target) || [];
    const injectMap = new Map(injects.map((inject) => [inject.parameterIndex, inject.token]));

    // 3. Get @Optional markers
    const optionals = MetadataManager.getOptional(target) || [];
    const optionalSet = new Set(
      optionals.filter((opt) => opt.parameterIndex !== undefined).map((opt) => opt.parameterIndex!),
    );

    // 4. Build resolved parameter array
    const resolvedParams: ResolvedParameter[] = [];

    for (let i = 0; i < paramTypes.length; i++) {
      // Use @Inject token if provided, otherwise use reflected type
      const token = injectMap.get(i) || paramTypes[i];
      const optional = optionalSet.has(i);

      // Validate that we have a valid token
      if (!token && !optional) {
        throw new MetadataError(
          target,
          `Cannot resolve parameter ${i}: no type information available. ` +
            `Either add @Inject(token) or enable emitDecoratorMetadata in tsconfig.json`,
        );
      }

      if (token) {
        resolvedParams.push({
          token,
          optional,
          index: i,
        });
      } else if (optional) {
        // Optional parameter with no token - will be undefined
        resolvedParams.push({
          token: undefined,
          optional: true,
          index: i,
        });
      }
    }

    return resolvedParams;
  }

  /**
   * Check if a constructor has any injectable parameters
   *
   * @param target The class to check
   * @returns true if the class has constructor parameters
   */
  static hasParameters(target: Constructor): boolean {
    const paramTypes = MetadataManager.getParamTypes(target);
    return paramTypes !== undefined && paramTypes.length > 0;
  }

  /**
   * Get the number of constructor parameters
   *
   * @param target The class to check
   * @returns Number of constructor parameters
   */
  static getParameterCount(target: Constructor): number {
    const paramTypes = MetadataManager.getParamTypes(target);
    return paramTypes?.length || 0;
  }
}
