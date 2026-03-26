/**
 * Route Metadata
 *
 * Класс содержащий полную информацию о роуте
 */

import type { Constructor } from "@ambrosia-unce/core";
import type { HttpMethod } from "../types/common.ts";
import type { ParameterMetadata } from "../types/metadata.ts";
import { extractParams, matches } from "./path-matcher.ts";

/**
 * Опции для создания RouteMetadata
 */
export interface RouteMetadataOptions {
  /**
   * HTTP метод
   */
  method: HttpMethod;

  /**
   * Полный путь роута (controller path + method path)
   */
  path: string;

  /**
   * Метод контроллера (функция-обработчик)
   */
  handler: Function;

  /**
   * Класс контроллера
   */
  controllerClass: Constructor;

  /**
   * Имя метода в классе
   */
  methodName: string | symbol;

  /**
   * Метаданные параметров метода
   */
  parameters: ParameterMetadata[];
}

/**
 * Route Metadata класс
 *
 * Содержит всю информацию о роуте для регистрации в HTTP провайдере
 */
export class RouteMetadata {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: Function;
  readonly controllerClass: Constructor;
  readonly methodName: string | symbol;
  readonly parameters: ParameterMetadata[];

  constructor(options: RouteMetadataOptions) {
    this.method = options.method;
    this.path = options.path;
    this.handler = options.handler;
    this.controllerClass = options.controllerClass;
    this.methodName = options.methodName;
    this.parameters = options.parameters;
  }

  /**
   * Проверяет, соответствует ли заданный путь этому роуту
   *
   * @param path - Путь для проверки
   * @returns true если путь соответствует
   *
   * @example
   * const route = new RouteMetadata({ path: '/users/:id', ... });
   * route.matches('/users/123'); // true
   * route.matches('/users/123/posts'); // false
   */
  matches(path: string): boolean {
    return matches(this.path, path);
  }

  /**
   * Извлекает параметры из пути
   *
   * @param path - Фактический путь запроса
   * @returns Объект с параметрами или null
   *
   * @example
   * const route = new RouteMetadata({ path: '/users/:id', ... });
   * route.extractParams('/users/123'); // { id: '123' }
   */
  extractParams(path: string): Record<string, string> | null {
    return extractParams(this.path, path);
  }

  /**
   * Создает строковое представление роута для отладки
   */
  toString(): string {
    return `${this.method} ${this.path} → ${this.controllerClass.name}.${String(this.methodName)}`;
  }
}
