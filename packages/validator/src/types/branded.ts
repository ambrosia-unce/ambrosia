/**
 * Branded types for specialized validation
 *
 * These types are recognized by the validator plugin and generate
 * optimized validation code specific to each brand.
 */

/**
 * Email address (validated with RFC 5322 simplified pattern)
 *
 * @example
 * ```typescript
 * interface User {
 *   email: Email;
 * }
 *
 * const user = assert<User>({ email: "user@example.com" });
 * ```
 */
export type Email = string & { readonly __brand: "Email" };

/**
 * UUID v4 (validated with RFC 4122 pattern)
 *
 * @example
 * ```typescript
 * interface Entity {
 *   id: UUID;
 * }
 * ```
 */
export type UUID = string & { readonly __brand: "UUID" };

/**
 * URL (validated as valid HTTP/HTTPS URL)
 *
 * @example
 * ```typescript
 * interface Link {
 *   url: URL;
 * }
 * ```
 */
export type URL = string & { readonly __brand: "URL" };

/**
 * Positive integer (> 0)
 *
 * @example
 * ```typescript
 * interface Product {
 *   quantity: PositiveInt;
 * }
 * ```
 */
export type PositiveInt = number & { readonly __brand: "PositiveInt" };

/**
 * Non-negative integer (>= 0)
 *
 * @example
 * ```typescript
 * interface Account {
 *   balance: NonNegativeInt;
 * }
 * ```
 */
export type NonNegativeInt = number & { readonly __brand: "NonNegativeInt" };

/**
 * ISO 8601 date string (YYYY-MM-DD)
 *
 * @example
 * ```typescript
 * interface Event {
 *   date: DateString;
 * }
 * ```
 */
export type DateString = string & { readonly __brand: "DateString" };

/**
 * ISO 8601 datetime string
 *
 * @example
 * ```typescript
 * interface Log {
 *   timestamp: DateTime;
 * }
 * ```
 */
export type DateTime = string & { readonly __brand: "DateTime" };

/**
 * JSON string (valid JSON)
 *
 * @example
 * ```typescript
 * interface Config {
 *   data: JSONString;
 * }
 * ```
 */
export type JSONString = string & { readonly __brand: "JSONString" };

/**
 * Phone number (E.164 format: +[country][number])
 *
 * @example
 * ```typescript
 * interface Contact {
 *   phone: PhoneNumber;
 * }
 * ```
 */
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };

/**
 * Credit card number (Luhn algorithm validated)
 *
 * @example
 * ```typescript
 * interface Payment {
 *   cardNumber: CreditCard;
 * }
 * ```
 */
export type CreditCard = string & { readonly __brand: "CreditCard" };

/**
 * IPv4 address
 *
 * @example
 * ```typescript
 * interface Server {
 *   ip: IPv4;
 * }
 * ```
 */
export type IPv4 = string & { readonly __brand: "IPv4" };

/**
 * IPv6 address
 *
 * @example
 * ```typescript
 * interface Server {
 *   ipv6: IPv6;
 * }
 * ```
 */
export type IPv6 = string & { readonly __brand: "IPv6" };

/**
 * Hexadecimal color (#RRGGBB or #RGB)
 *
 * @example
 * ```typescript
 * interface Theme {
 *   primaryColor: HexColor;
 * }
 * ```
 */
export type HexColor = string & { readonly __brand: "HexColor" };

/**
 * Base64 encoded string
 *
 * @example
 * ```typescript
 * interface File {
 *   content: Base64;
 * }
 * ```
 */
export type Base64 = string & { readonly __brand: "Base64" };

/**
 * Alphanumeric string (a-z, A-Z, 0-9)
 *
 * @example
 * ```typescript
 * interface User {
 *   username: Alphanumeric;
 * }
 * ```
 */
export type Alphanumeric = string & { readonly __brand: "Alphanumeric" };

/**
 * Lowercase string
 *
 * @example
 * ```typescript
 * interface Tag {
 *   slug: Lowercase;
 * }
 * ```
 */
export type Lowercase = string & { readonly __brand: "Lowercase" };

/**
 * Uppercase string
 *
 * @example
 * ```typescript
 * interface Code {
 *   countryCode: Uppercase;
 * }
 * ```
 */
export type Uppercase = string & { readonly __brand: "Uppercase" };

/**
 * Non-empty string (length > 0)
 *
 * @example
 * ```typescript
 * interface User {
 *   name: NonEmptyString;
 * }
 * ```
 */
export type NonEmptyString = string & { readonly __brand: "NonEmptyString" };

/**
 * Integer number (no decimals)
 *
 * @example
 * ```typescript
 * interface Counter {
 *   count: Integer;
 * }
 * ```
 */
export type Integer = number & { readonly __brand: "Integer" };

/**
 * Safe integer (Number.isSafeInteger)
 *
 * @example
 * ```typescript
 * interface Stats {
 *   views: SafeInteger;
 * }
 * ```
 */
export type SafeInteger = number & { readonly __brand: "SafeInteger" };
