/**
 * Lifecycle types for HTTP request processing
 */

import type { Constructor } from "@ambrosia/core";

/**
 * Lifecycle metadata for storing arrays of lifecycle components
 */
export interface LifecycleMetadata {
  guards?: Constructor[];
  interceptors?: Constructor[];
  pipes?: Constructor[];
  middleware?: Constructor[];
  filters?: Constructor[];
}

/**
 * Argument metadata for validation
 */
export interface ArgumentMetadata {
  /**
   * Type of the parameter
   */
  type: "body" | "query" | "param" | "custom";

  /**
   * Metatype (class) of the parameter
   */
  metatype?: any;

  /**
   * Data passed to decorator (e.g., 'id' in @Param('id'))
   */
  data?: string;
}
