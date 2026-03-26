/**
 * Metadata key constants
 *
 * These keys are used with reflect-metadata to store and retrieve
 * metadata attached to classes, methods, and properties by decorators.
 */

/**
 * Metadata keys for Ambrosia decorators
 */
export const METADATA_KEYS = {
  /** @Injectable metadata */
  INJECTABLE: "ambrosia:injectable",

  /** @Inject metadata (array of injections) */
  INJECT: "ambrosia:inject",

  /** @Autowired metadata (array of property injections) */
  AUTOWIRED: "ambrosia:autowired",

  /** @Optional metadata (array of optional markers) */
  OPTIONAL: "ambrosia:optional",

  /** @Implements metadata */
  IMPLEMENTS: "ambrosia:implements",

  /**
   * TypeScript-emitted metadata keys
   * These are automatically generated when emitDecoratorMetadata is enabled
   */

  /** Constructor parameter types - emitted by TypeScript */
  PARAM_TYPES: "design:paramtypes",

  /** Property or parameter type - emitted by TypeScript */
  TYPE: "design:type",

  /** Method return type - emitted by TypeScript */
  RETURN_TYPE: "design:returntype",
} as const;

/**
 * Type for metadata keys
 */
export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];
