/**
 * Metadata types for HTTP decorators
 */

import type { Constructor, Scope } from "@ambrosia-unce/core";
import type { HttpMethod } from "./common.ts";

/**
 * Метаданные контроллера
 */
export interface ControllerMetadata {
  /**
   * Пути контроллера (всегда массив, нормализованный)
   */
  path: string[];

  /**
   * Класс контроллера
   */
  target: Constructor;

  /**
   * Scope контроллера (по умолчанию SINGLETON)
   */
  scope: Scope;

  /**
   * Guards applied to all controller methods
   */
  guards?: Constructor[];

  /**
   * Interceptors applied to all controller methods
   */
  interceptors?: Constructor[];

  /**
   * Pipes applied to all controller methods
   */
  pipes?: Constructor[];

  /**
   * Middleware applied to all controller methods
   */
  middleware?: Constructor[];

  /**
   * Exception filters applied to all controller methods
   */
  filters?: Constructor[];
}

/**
 * Опции для декоратора @Controller
 */
export interface ControllerOptions {
  /**
   * Путь или пути контроллера
   */
  path?: string | string[];

  /**
   * Scope для контроллера
   */
  scope?: Scope;
}

/**
 * Метаданные метода роута (GET, POST, etc.)
 */
export interface RouteMethodMetadata {
  /**
   * HTTP метод
   */
  method: HttpMethod;

  /**
   * Пути метода (нормализованные)
   */
  path: string[];

  /**
   * Имя метода в классе
   */
  methodName: string | symbol;

  /**
   * Класс контроллера
   */
  target: Constructor;

  /**
   * Guards applied to this method
   */
  guards?: Constructor[];

  /**
   * Interceptors applied to this method
   */
  interceptors?: Constructor[];

  /**
   * Pipes applied to this method
   */
  pipes?: Constructor[];

  /**
   * Middleware applied to this method
   */
  middleware?: Constructor[];

  /**
   * Exception filters applied to this method
   */
  filters?: Constructor[];

  /**
   * Response status code
   */
  statusCode?: number;

  /**
   * Response headers
   */
  headers?: Record<string, string>;
}

/**
 * Опции для декораторов методов (@Get, @Post, etc.)
 */
export interface RouteOptions {
  /**
   * Путь или пути роута
   */
  path?: string | string[];

  // В будущем: statusCode, headers, etc.
}

/**
 * Тип параметра
 */
export enum ParameterType {
  /**
   * Тело запроса (@Body)
   */
  BODY = "BODY",

  /**
   * Query параметры (@Query)
   */
  QUERY = "QUERY",

  /**
   * Path параметры (@Param)
   */
  PARAM = "PARAM",

  /**
   * Все заголовки (@Headers)
   */
  HEADERS = "HEADERS",

  /**
   * Один заголовок (@Header)
   */
  HEADER = "HEADER",

  /**
   * Нативный контекст провайдера (@Ctx)
   */
  CONTEXT = "CONTEXT",

  /**
   * Full request object (@Req, @Request)
   */
  REQUEST = "REQUEST",

  /**
   * Full response object (@Res, @Response)
   */
  RESPONSE = "RESPONSE",

  /**
   * Session data (@Session)
   */
  SESSION = "SESSION",

  /**
   * Cookie value(s) (@Cookie)
   */
  COOKIE = "COOKIE",

  /**
   * Client IP address (@Ip)
   */
  IP = "IP",

  /**
   * Single uploaded file (@UploadedFile)
   */
  UPLOADED_FILE = "UPLOADED_FILE",

  /**
   * Multiple uploaded files (@UploadedFiles)
   */
  UPLOADED_FILES = "UPLOADED_FILES",
}

/**
 * Redirect metadata
 */
export interface RedirectMetadata {
  url: string;
  statusCode: number;
}

/**
 * Метаданные параметра
 */
export interface ParameterMetadata {
  /**
   * Тип параметра
   */
  type: ParameterType;

  /**
   * Индекс параметра в функции
   */
  parameterIndex: number;

  /**
   * Ключ для извлечения (для @Query('name'), @Param('id'), @Header('authorization'))
   */
  propertyKey?: string;

  /**
   * Класс контроллера
   */
  target: Constructor;

  /**
   * Имя метода
   */
  methodName: string | symbol;

  /**
   * Pipes applied to this parameter
   */
  pipes?: Constructor[];
}
