/**
 * @Controller decorator
 *
 * Marks a class as an HTTP controller and registers it with the DI system
 */

import { type Constructor, DEFAULT_SCOPE, Injectable, type Scope } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata";
import { normalize } from "../routing/path-matcher.ts";
import type { ControllerMetadata, ControllerOptions } from "../types";

/**
 * Нормализует пути (конвертирует в массив и нормализует каждый)
 */
function normalizePaths(paths: string | string[]): string[] {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  return pathArray.map(normalize);
}

/**
 * @Controller decorator
 *
 * Декорирует класс как HTTP контроллер:
 * - Регистрирует класс в DI системе (@Injectable)
 * - Сохраняет метаданные контроллера (пути, scope)
 * - Регистрирует в ControllerRegistry для сборки роутов
 *
 * @param path - Путь или массив путей контроллера
 *
 * @example
 * ```typescript
 * @Controller('/api/users')
 * class UserController {}
 *
 * @Controller(['/api/v1/users', '/api/v2/users'])
 * class UserController {}
 *
 * @Controller({ path: '/api/users', scope: Scope.REQUEST })
 * class UserController {}
 * ```
 */
export function Controller(path: string): ClassDecorator;
export function Controller(paths: string[]): ClassDecorator;
export function Controller(options: ControllerOptions): ClassDecorator;
export function Controller(pathOrOptions: string | string[] | ControllerOptions): ClassDecorator {
  return <T extends Function>(target: T): T => {
    const constructor = target as unknown as Constructor;

    // Парсим аргументы
    let paths: string[];
    let scope: Scope = DEFAULT_SCOPE; // По умолчанию SINGLETON

    if (typeof pathOrOptions === "string") {
      paths = normalizePaths(pathOrOptions);
    } else if (Array.isArray(pathOrOptions)) {
      paths = normalizePaths(pathOrOptions);
    } else {
      // ControllerOptions
      paths = pathOrOptions.path ? normalizePaths(pathOrOptions.path) : ["/"];
      scope = pathOrOptions.scope || DEFAULT_SCOPE;
    }

    // Создаем метаданные контроллера
    const metadata: ControllerMetadata = {
      path: paths,
      target: constructor,
      scope,
    };

    // Сохраняем метаданные
    HttpMetadataManager.setController(constructor, metadata);

    // Автоматически применяем @Injectable если еще не применен
    // Проверяем наличие метаданных Injectable
    if (!Reflect.hasMetadata("ambrosia:injectable", constructor)) {
      Injectable({ scope })(target);
    }

    return target;
  };
}
