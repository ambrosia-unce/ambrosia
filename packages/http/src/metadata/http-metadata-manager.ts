/**
 * HTTP Metadata Manager
 *
 * Управляет метаданными HTTP декораторов (@Controller, @Get, @Body, etc.)
 */

import "reflect-metadata";
import type { Constructor } from "@ambrosia/core";
import type {
  ControllerMetadata,
  ParameterMetadata,
  RedirectMetadata,
  RouteMethodMetadata,
} from "../types";
import { HTTP_METADATA_KEYS } from "./constants";

/**
 * Глобальный реестр контроллеров
 */
export class ControllerRegistry {
  private static controllers = new Set<Constructor>();

  /**
   * Регистрирует контроллер
   */
  static register(controller: Constructor): void {
    ControllerRegistry.controllers.add(controller);
  }

  /**
   * Проверяет, зарегистрирован ли контроллер
   */
  static has(controller: Constructor): boolean {
    return ControllerRegistry.controllers.has(controller);
  }

  /**
   * Получает все зарегистрированные контроллеры
   */
  static getAll(): Constructor[] {
    return Array.from(ControllerRegistry.controllers);
  }

  /**
   * Очищает реестр (для тестов)
   */
  static clear(): void {
    ControllerRegistry.controllers.clear();
  }
}

/**
 * HTTP Metadata Manager
 *
 * Предоставляет API для работы с метаданными HTTP декораторов
 *
 * PERFORMANCE: Uses WeakMap caching for metadata lookups
 */
export class HttpMetadataManager {
  // ==================== Caches ====================
  // Uses Map with composite string key "ClassName#methodName" to avoid
  // cache collisions where all methods of a controller shared one slot.

  private static guardsCache = new Map<string, Constructor[]>();
  private static interceptorsCache = new Map<string, Constructor[]>();
  private static pipesCache = new Map<string, Constructor[]>();
  private static middlewareCache = new Map<string, any[]>();
  private static filtersCache = new Map<string, Constructor[]>();
  private static responseHeadersCache = new Map<string, Record<string, string>>();
  private static responseStatusCache = new Map<string, number>();

  private static cacheKey(target: Constructor, methodName?: string | symbol): string {
    return methodName ? `${target.name}#${String(methodName)}` : target.name;
  }
  // ==================== Controller Metadata ====================

  /**
   * Устанавливает метаданные контроллера
   */
  static setController(target: Constructor, metadata: ControllerMetadata): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.CONTROLLER, metadata, target);
    ControllerRegistry.register(target);
  }

  /**
   * Получает метаданные контроллера
   */
  static getController(target: Constructor): ControllerMetadata | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.CONTROLLER, target);
  }

  /**
   * Проверяет, является ли класс контроллером
   */
  static isController(target: Constructor): boolean {
    return Reflect.hasMetadata(HTTP_METADATA_KEYS.CONTROLLER, target);
  }

  // ==================== Route Method Metadata ====================

  /**
   * Добавляет метаданные метода роута
   */
  static addRouteMethod(
    target: Constructor,
    methodName: string | symbol,
    metadata: RouteMethodMetadata,
  ): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.ROUTE_METHOD, metadata, target.prototype, methodName);
  }

  /**
   * Получает метаданные метода роута
   */
  static getRouteMethod(
    target: Constructor,
    methodName: string | symbol,
  ): RouteMethodMetadata | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.ROUTE_METHOD, target.prototype, methodName);
  }

  /**
   * Получает все методы роутов для контроллера
   */
  static getRouteMethods(target: Constructor): RouteMethodMetadata[] {
    const methods: RouteMethodMetadata[] = [];
    const prototype = target.prototype;

    // Получаем все методы прототипа
    const methodNames = Object.getOwnPropertyNames(prototype);

    for (const methodName of methodNames) {
      if (methodName === "constructor") continue;

      const metadata = HttpMetadataManager.getRouteMethod(target, methodName);
      if (metadata) {
        methods.push(metadata);
      }
    }

    return methods;
  }

  // ==================== Parameter Metadata ====================

  /**
   * Добавляет метаданные параметра
   */
  static addParameter(
    target: Constructor,
    methodName: string | symbol,
    metadata: ParameterMetadata,
  ): void {
    // Получаем существующие параметры или создаем новый массив
    const existing: ParameterMetadata[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.PARAMETERS, target.prototype, methodName) || [];

    // Добавляем новый параметр
    existing.push(metadata);

    // Сохраняем обратно
    Reflect.defineMetadata(HTTP_METADATA_KEYS.PARAMETERS, existing, target.prototype, methodName);
  }

  /**
   * Получает метаданные параметров для метода
   */
  static getParameters(target: Constructor, methodName: string | symbol): ParameterMetadata[] {
    const parameters: ParameterMetadata[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.PARAMETERS, target.prototype, methodName) || [];

    // Сортируем по parameterIndex для правильного порядка
    return parameters.sort((a, b) => a.parameterIndex - b.parameterIndex);
  }

  // ==================== Utility Methods ====================

  /**
   * Получает все зарегистрированные контроллеры
   */
  static getAllControllers(): Constructor[] {
    return ControllerRegistry.getAll();
  }

  /**
   * Очищает все метаданные для класса (для тестов)
   */
  static clearMetadata(target: Constructor): void {
    Reflect.deleteMetadata(HTTP_METADATA_KEYS.CONTROLLER, target);

    const methodNames = Object.getOwnPropertyNames(target.prototype);
    for (const methodName of methodNames) {
      if (methodName === "constructor") continue;
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.ROUTE_METHOD, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.PARAMETERS, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.GUARDS, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.INTERCEPTORS, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.PIPES, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.MIDDLEWARE, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.FILTERS, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.RESPONSE_HEADERS, target.prototype, methodName);
      Reflect.deleteMetadata(HTTP_METADATA_KEYS.RESPONSE_STATUS, target.prototype, methodName);
    }
  }

  // ==================== Lifecycle Metadata (Guards, Interceptors, Pipes, etc.) ====================

  /**
   * Add guard metadata to controller or method
   */
  static addGuard(
    target: Constructor,
    methodName: string | symbol | undefined,
    guard: Constructor,
  ): void {
    const obj = methodName ? target.prototype : target;
    const existing: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.GUARDS, obj, methodName as any) || [];
    existing.push(guard);
    Reflect.defineMetadata(HTTP_METADATA_KEYS.GUARDS, existing, obj, methodName as any);
    HttpMetadataManager.guardsCache.delete(HttpMetadataManager.cacheKey(target, methodName));
  }

  /**
   * Get guards for controller or method (cached)
   */
  static getGuards(target: Constructor, methodName?: string | symbol): Constructor[] {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.guardsCache.has(key)) {
      return HttpMetadataManager.guardsCache.get(key)!;
    }
    const obj = methodName ? target.prototype : target;
    const guards: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.GUARDS, obj, methodName as any) || [];
    HttpMetadataManager.guardsCache.set(key, guards);
    return guards;
  }

  /**
   * Add interceptor metadata to controller or method
   */
  static addInterceptor(
    target: Constructor,
    methodName: string | symbol | undefined,
    interceptor: Constructor,
  ): void {
    const obj = methodName ? target.prototype : target;
    const existing: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.INTERCEPTORS, obj, methodName as any) || [];
    existing.push(interceptor);
    Reflect.defineMetadata(HTTP_METADATA_KEYS.INTERCEPTORS, existing, obj, methodName as any);
    HttpMetadataManager.interceptorsCache.delete(HttpMetadataManager.cacheKey(target, methodName));
  }

  /**
   * Get interceptors for controller or method (cached)
   */
  static getInterceptors(target: Constructor, methodName?: string | symbol): Constructor[] {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.interceptorsCache.has(key)) {
      return HttpMetadataManager.interceptorsCache.get(key)!;
    }
    const obj = methodName ? target.prototype : target;
    const interceptors: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.INTERCEPTORS, obj, methodName as any) || [];
    HttpMetadataManager.interceptorsCache.set(key, interceptors);
    return interceptors;
  }

  /**
   * Add pipe metadata to controller or method
   */
  static addPipe(
    target: Constructor,
    methodName: string | symbol | undefined,
    pipe: Constructor,
  ): void {
    const obj = methodName ? target.prototype : target;
    const existing: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.PIPES, obj, methodName as any) || [];
    existing.push(pipe);
    Reflect.defineMetadata(HTTP_METADATA_KEYS.PIPES, existing, obj, methodName as any);
    HttpMetadataManager.pipesCache.delete(HttpMetadataManager.cacheKey(target, methodName));
  }

  /**
   * Get pipes for controller or method (cached)
   */
  static getPipes(target: Constructor, methodName?: string | symbol): Constructor[] {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.pipesCache.has(key)) {
      return HttpMetadataManager.pipesCache.get(key)!;
    }
    const obj = methodName ? target.prototype : target;
    const pipes: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.PIPES, obj, methodName as any) || [];
    HttpMetadataManager.pipesCache.set(key, pipes);
    return pipes;
  }

  /**
   * Add middleware metadata to controller or method
   */
  static addMiddleware(target: Constructor, middleware: any, methodName?: string | symbol): void {
    const obj = methodName ? target.prototype : target;
    const existing: any[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.MIDDLEWARE, obj, methodName as any) || [];
    existing.push(middleware);
    Reflect.defineMetadata(HTTP_METADATA_KEYS.MIDDLEWARE, existing, obj, methodName as any);
    HttpMetadataManager.middlewareCache.delete(HttpMetadataManager.cacheKey(target, methodName));
  }

  /**
   * Get middleware for controller or method (cached)
   */
  static getMiddleware(target: Constructor, methodName?: string | symbol): any[] {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.middlewareCache.has(key)) {
      return HttpMetadataManager.middlewareCache.get(key)!;
    }
    const obj = methodName ? target.prototype : target;
    const middleware: any[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.MIDDLEWARE, obj, methodName as any) || [];
    HttpMetadataManager.middlewareCache.set(key, middleware);
    return middleware;
  }

  /**
   * Add exception filter metadata to controller or method
   */
  static addFilter(
    target: Constructor,
    methodName: string | symbol | undefined,
    filter: Constructor,
  ): void {
    const obj = methodName ? target.prototype : target;
    const existing: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.FILTERS, obj, methodName as any) || [];
    existing.push(filter);
    Reflect.defineMetadata(HTTP_METADATA_KEYS.FILTERS, existing, obj, methodName as any);
    HttpMetadataManager.filtersCache.delete(HttpMetadataManager.cacheKey(target, methodName));
  }

  /**
   * Get exception filters for controller or method (cached)
   */
  static getFilters(target: Constructor, methodName?: string | symbol): Constructor[] {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.filtersCache.has(key)) {
      return HttpMetadataManager.filtersCache.get(key)!;
    }
    const obj = methodName ? target.prototype : target;
    const filters: Constructor[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.FILTERS, obj, methodName as any) || [];
    HttpMetadataManager.filtersCache.set(key, filters);
    return filters;
  }

  // ==================== Response Metadata ====================

  /**
   * Add response header metadata
   */
  static addResponseHeader(
    target: Constructor,
    methodName: string | symbol,
    name: string,
    value: string,
  ): void {
    const existing: Record<string, string> =
      Reflect.getMetadata(HTTP_METADATA_KEYS.RESPONSE_HEADERS, target.prototype, methodName) || {};
    existing[name] = value;
    Reflect.defineMetadata(
      HTTP_METADATA_KEYS.RESPONSE_HEADERS,
      existing,
      target.prototype,
      methodName,
    );
    HttpMetadataManager.responseHeadersCache.delete(
      HttpMetadataManager.cacheKey(target, methodName),
    );
  }

  /**
   * Get response headers metadata (cached)
   */
  static getResponseHeaders(
    target: Constructor,
    methodName: string | symbol,
  ): Record<string, string> | undefined {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.responseHeadersCache.has(key)) {
      return HttpMetadataManager.responseHeadersCache.get(key);
    }
    const headers: Record<string, string> | undefined = Reflect.getMetadata(
      HTTP_METADATA_KEYS.RESPONSE_HEADERS,
      target.prototype,
      methodName,
    );
    if (headers) {
      HttpMetadataManager.responseHeadersCache.set(key, headers);
    }
    return headers;
  }

  /**
   * Set response status code metadata
   */
  static setResponseStatus(target: Constructor, methodName: string | symbol, status: number): void {
    Reflect.defineMetadata(
      HTTP_METADATA_KEYS.RESPONSE_STATUS,
      status,
      target.prototype,
      methodName,
    );
    HttpMetadataManager.responseStatusCache.delete(
      HttpMetadataManager.cacheKey(target, methodName),
    );
  }

  /**
   * Get response status code metadata (cached)
   */
  static getResponseStatus(target: Constructor, methodName: string | symbol): number | undefined {
    const key = HttpMetadataManager.cacheKey(target, methodName);
    if (HttpMetadataManager.responseStatusCache.has(key)) {
      return HttpMetadataManager.responseStatusCache.get(key);
    }
    const status: number | undefined = Reflect.getMetadata(
      HTTP_METADATA_KEYS.RESPONSE_STATUS,
      target.prototype,
      methodName,
    );
    if (status !== undefined) {
      HttpMetadataManager.responseStatusCache.set(key, status);
    }
    return status;
  }

  // ==================== Redirect Metadata ====================

  static setRedirect(
    target: Constructor,
    methodName: string | symbol,
    url: string,
    statusCode: number = 302,
  ): void {
    const metadata: RedirectMetadata = { url, statusCode };
    Reflect.defineMetadata(HTTP_METADATA_KEYS.REDIRECT, metadata, target.prototype, methodName);
  }

  static getRedirect(
    target: Constructor,
    methodName: string | symbol,
  ): RedirectMetadata | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.REDIRECT, target.prototype, methodName);
  }

  // ==================== Custom Metadata (SetMetadata / @Public) ====================

  static setCustomMetadata(
    target: Constructor,
    methodName: string | symbol | undefined,
    key: string,
    value: any,
  ): void {
    const obj = methodName ? target.prototype : target;
    const existing: Record<string, any> =
      Reflect.getMetadata(HTTP_METADATA_KEYS.CUSTOM_METADATA, obj, methodName as any) || {};
    existing[key] = value;
    Reflect.defineMetadata(HTTP_METADATA_KEYS.CUSTOM_METADATA, existing, obj, methodName as any);
  }

  static getCustomMetadata(
    target: Constructor,
    methodName: string | symbol | undefined,
    key: string,
  ): any {
    const obj = methodName ? target.prototype : target;
    const metadata: Record<string, any> =
      Reflect.getMetadata(HTTP_METADATA_KEYS.CUSTOM_METADATA, obj, methodName as any) || {};
    return metadata[key];
  }

  static getAllCustomMetadata(
    target: Constructor,
    methodName: string | symbol | undefined,
  ): Record<string, any> {
    const obj = methodName ? target.prototype : target;
    return Reflect.getMetadata(HTTP_METADATA_KEYS.CUSTOM_METADATA, obj, methodName as any) || {};
  }

  // ==================== SSE Metadata ====================

  static setSse(target: Constructor, methodName: string | symbol): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.SSE, true, target.prototype, methodName);
  }

  static isSse(target: Constructor, methodName: string | symbol): boolean {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.SSE, target.prototype, methodName) === true;
  }

  // ==================== Serialize Metadata ====================

  static setSerialize(
    target: Constructor,
    methodName: string | symbol,
    dtoClass: Constructor,
  ): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.SERIALIZE, dtoClass, target.prototype, methodName);
  }

  static getSerialize(target: Constructor, methodName: string | symbol): Constructor | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.SERIALIZE, target.prototype, methodName);
  }

  // ==================== Catch Metadata ====================

  static setCatch(target: Constructor, exceptionTypes: Constructor[]): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.CATCH, exceptionTypes, target);
  }

  static getCatch(target: Constructor): Constructor[] | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.CATCH, target);
  }

  // ==================== Timeout Metadata ====================

  static setTimeout(target: Constructor, methodName: string | symbol, ms: number): void {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.TIMEOUT, ms, target.prototype, methodName);
  }

  static getTimeout(target: Constructor, methodName: string | symbol): number | undefined {
    return Reflect.getMetadata(HTTP_METADATA_KEYS.TIMEOUT, target.prototype, methodName);
  }
}
