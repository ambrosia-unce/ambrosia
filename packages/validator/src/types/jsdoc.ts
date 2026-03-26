/**
 * JSDoc tags for validation constraints
 *
 * These tags can be used in JSDoc comments to specify validation rules.
 * The validator plugin parses these tags and generates corresponding validation code.
 *
 * @example
 * ```typescript
 * interface User {
 *   /**
 *    * User's display name
 *    * ＠minLength 3
 *    * ＠maxLength 50
 *    * ＠pattern ^[a-zA-Z0-9_]+$
 *    *\/
 *   name: string;
 *
 *   /**
 *    * ＠format email
 *    *\/
 *   email: string;
 *
 *   /**
 *    * ＠minimum 18
 *    * ＠maximum 120
 *    *\/
 *   age: number;
 * }
 * ```
 */

/**
 * Supported JSDoc validation tags
 */
export const JSDOC_TAGS = {
  // String constraints
  MIN_LENGTH: "@minLength",
  MAX_LENGTH: "@maxLength",
  PATTERN: "@pattern",
  FORMAT: "@format",

  // Number constraints
  MINIMUM: "@minimum",
  MAXIMUM: "@maximum",
  EXCLUSIVE_MINIMUM: "@exclusiveMinimum",
  EXCLUSIVE_MAXIMUM: "@exclusiveMaximum",
  MULTIPLE_OF: "@multipleOf",

  // Array constraints
  MIN_ITEMS: "@minItems",
  MAX_ITEMS: "@maxItems",
  UNIQUE_ITEMS: "@uniqueItems",

  // Object constraints
  MIN_PROPERTIES: "@minProperties",
  MAX_PROPERTIES: "@maxProperties",

  // General constraints
  OPTIONAL: "@optional",
  NULLABLE: "@nullable",
  DEFAULT: "@default",
  CONST: "@const",
  ENUM: "@enum",

  // Custom validators
  VALIDATE: "@validate",
  TRANSFORM: "@transform",
} as const;

/**
 * Supported format specifiers for @format tag
 */
export const FORMATS = {
  EMAIL: "email",
  UUID: "uuid",
  URL: "url",
  URI: "uri",
  DATE: "date",
  DATE_TIME: "date-time",
  TIME: "time",
  IPV4: "ipv4",
  IPV6: "ipv6",
  HOSTNAME: "hostname",
  JSON: "json",
  BASE64: "base64",
  HEX: "hex",
  PHONE: "phone",
  CREDIT_CARD: "credit-card",
  COLOR: "color",
} as const;

/**
 * Type for JSDoc tag values
 */
export interface JSDocTagValue {
  tag: string;
  value: string | number | boolean;
}

/**
 * Parsed JSDoc constraints from comments
 */
export interface JSDocConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  minProperties?: number;
  maxProperties?: number;

  optional?: boolean;
  nullable?: boolean;
  default?: unknown;
  const?: unknown;
  enum?: unknown[];

  validate?: string;
  transform?: string;
}
