/**
 * HTTP Context
 *
 * Провайдеро-агностичная абстракция HTTP контекста запроса
 */

import type { IHttpRequest, IHttpResponse } from "../types/common.ts";

/**
 * HTTP Context интерфейс
 *
 * Предоставляет унифицированный доступ к данным запроса независимо от провайдера
 */
export interface IHttpContext {
  /**
   * HTTP request
   */
  request: IHttpRequest;

  /**
   * HTTP response
   */
  response: IHttpResponse;

  /**
   * Path параметры (из :id, :name, etc.)
   */
  params: Record<string, string>;

  /**
   * Query параметры (из ?key=value)
   */
  query: Record<string, string | string[]>;

  /**
   * HTTP заголовки
   */
  headers: Record<string, string | string[]>;

  /**
   * Тело запроса (уже распарсенное)
   */
  body: any;

  /**
   * Нативный контекст провайдера
   * Для доступа к специфичным API провайдера
   */
  native: any;

  /**
   * Metadata storage для хранения произвольных данных в рамках запроса
   */
  metadata: Map<string, any>;

  /**
   * Получить значение из metadata
   */
  get<T>(key: string): T | undefined;

  /**
   * Установить значение в metadata
   */
  set<T>(key: string, value: T): void;

  /**
   * Проверить наличие ключа в metadata
   */
  has(key: string): boolean;
}

/**
 * HTTP Context класс
 *
 * Реализация IHttpContext
 */
export class HttpContext implements IHttpContext {
  request: IHttpRequest;
  response: IHttpResponse;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  headers: Record<string, string | string[]>;
  body: any;
  native: any;
  metadata: Map<string, any>;

  constructor(
    request: IHttpRequest,
    response: IHttpResponse,
    params: Record<string, string> = {},
    native: any = null,
  ) {
    this.request = request;
    this.response = response;
    this.params = params;
    this.query = request.query;
    this.headers = request.headers;
    this.body = request.body;
    this.native = native;
    this.metadata = new Map();
  }

  /**
   * Получить значение из metadata
   */
  get<T>(key: string): T | undefined {
    return this.metadata.get(key) as T | undefined;
  }

  /**
   * Установить значение в metadata
   */
  set<T>(key: string, value: T): void {
    this.metadata.set(key, value);
  }

  /**
   * Проверить наличие ключа в metadata
   */
  has(key: string): boolean {
    return this.metadata.has(key);
  }

  /**
   * Удалить значение из metadata
   */
  delete(key: string): boolean {
    return this.metadata.delete(key);
  }

  /**
   * Очистить все metadata
   */
  clearMetadata(): void {
    this.metadata.clear();
  }
}
