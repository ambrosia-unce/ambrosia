/**
 * Common HTTP types and interfaces
 */

import type { Constructor, PackDefinition } from "@ambrosia-unce/core";

/**
 * HttpPackDefinition extends the core PackDefinition with HTTP-specific fields.
 * Controllers are an HTTP concept and do not belong in the core DI layer.
 */
export interface HttpPackDefinition extends PackDefinition {
  /**
   * Controller classes to register with the HTTP application.
   */
  controllers?: Constructor[];
}

/**
 * HTTP методы
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

/**
 * HTTP статус коды
 */
export enum HttpStatus {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // 4xx Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Uploaded file metadata
 */
export interface UploadedFileInfo {
  /**
   * Field name from form
   */
  fieldname: string;

  /**
   * Original file name
   */
  originalname: string;

  /**
   * MIME type
   */
  mimetype: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File buffer (if loaded in memory)
   */
  buffer?: Buffer;

  /**
   * File path (if saved to disk)
   */
  path?: string;
}

/**
 * Cookie options for response
 */
export interface CookieOptions {
  /**
   * Max age in milliseconds
   */
  maxAge?: number;

  /**
   * Expiration date
   */
  expires?: Date;

  /**
   * Cookie path
   */
  path?: string;

  /**
   * Cookie domain
   */
  domain?: string;

  /**
   * Secure flag (HTTPS only)
   */
  secure?: boolean;

  /**
   * HttpOnly flag
   */
  httpOnly?: boolean;

  /**
   * SameSite policy
   */
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * HTTP Request интерфейс (провайдеро-агностичный)
 */
export interface IHttpRequest {
  /**
   * HTTP метод (GET, POST, etc.)
   */
  method: HttpMethod;

  /**
   * Полный URL запроса
   */
  url: string;

  /**
   * Путь запроса (без query string)
   */
  path: string;

  /**
   * HTTP заголовки
   */
  headers: Record<string, string | string[]>;

  /**
   * Query параметры
   */
  query: Record<string, string | string[]>;

  /**
   * Тело запроса (уже распарсенное)
   */
  body: any;

  /**
   * Cookies (опционально)
   */
  cookies?: Record<string, string>;

  /**
   * Session data (опционально)
   */
  session?: any;

  /**
   * Client IP address
   */
  ip?: string;

  /**
   * Uploaded files (multipart/form-data)
   */
  files?: UploadedFileInfo[];

  /**
   * Protocol (http/https)
   */
  protocol?: string;

  /**
   * Hostname
   */
  hostname?: string;
}

/**
 * HTTP Response интерфейс (провайдеро-агностичный)
 */
export interface IHttpResponse {
  /**
   * HTTP статус код
   */
  status: number;

  /**
   * HTTP заголовки ответа
   */
  headers: Record<string, string>;

  /**
   * Тело ответа
   */
  body: any;

  /**
   * Установить статус код
   */
  setStatus(status: number): this;

  /**
   * Установить заголовок
   */
  setHeader(key: string, value: string): this;

  /**
   * Отправить JSON ответ
   */
  json(data: any): this;

  /**
   * Отправить произвольные данные
   */
  send(data: any): this;

  /**
   * Set cookie
   */
  setCookie(name: string, value: string, options?: CookieOptions): this;

  /**
   * Redirect to URL
   */
  redirect(url: string, status?: number): this;
}
