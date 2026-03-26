/**
 * Environment variable value parsers.
 *
 * Each parser is a pure function: string → typed value.
 * Throws descriptive errors on parse failure for fast startup diagnostics.
 */

import type { ConfigType } from "./types.ts";

/**
 * Parse a string value as-is (identity).
 */
function parseString(value: string): string {
  return value;
}

/**
 * Parse a string value as an integer.
 * Throws if the value is not a valid integer.
 */
function parseInt(value: string, key: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new ConfigParseError(key, value, "int", "Value is not a valid integer");
  }
  return n;
}

/**
 * Parse a string value as a floating-point number.
 * Throws if the value is not a valid number.
 */
function parseFloat(value: string, key: string): number {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) {
    throw new ConfigParseError(key, value, "float", "Value is not a valid number");
  }
  return n;
}

/**
 * Parse a string value as a boolean.
 * Truthy: 'true', '1', 'yes'
 * Falsy: everything else
 */
function parseBool(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes";
}

/**
 * Parse a string value as an array by splitting on a separator.
 */
function parseArray(value: string, separator = ","): string[] {
  return value.split(separator).map((s) => s.trim());
}

/**
 * Parse a string value as JSON.
 * Throws if the value is not valid JSON.
 */
function parseJson(value: string, key: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ConfigParseError(key, value, "json", "Value is not valid JSON");
  }
}

/**
 * Error thrown when a config value fails to parse.
 */
export class ConfigParseError extends Error {
  constructor(
    public readonly key: string,
    public readonly rawValue: string,
    public readonly expectedType: string,
    message: string,
  ) {
    super(`[Config] Failed to parse "${key}" as ${expectedType}: ${message} (raw: "${rawValue}")`);
    this.name = "ConfigParseError";
  }
}

/**
 * Error thrown when a required config value is missing.
 */
export class ConfigMissingError extends Error {
  constructor(
    public readonly key: string,
    public readonly envVar: string,
  ) {
    super(`[Config] Required config "${key}" is missing: environment variable "${envVar}" is not set and no default was provided`);
    this.name = "ConfigMissingError";
  }
}

/**
 * Parse a raw env string into a typed value according to the specified type.
 *
 * @param value - The raw string value from the environment
 * @param type - The target type to parse into
 * @param key - The config key name (for error messages)
 * @param separator - Array separator (only used for 'array' type)
 * @returns The parsed value
 */
export function parseValue(
  value: string,
  type: ConfigType,
  key: string,
  separator?: string,
): unknown {
  switch (type) {
    case "string":
      return parseString(value);
    case "int":
      return parseInt(value, key);
    case "float":
      return parseFloat(value, key);
    case "bool":
      return parseBool(value);
    case "array":
      return parseArray(value, separator);
    case "json":
      return parseJson(value, key);
    default:
      return parseString(value);
  }
}
