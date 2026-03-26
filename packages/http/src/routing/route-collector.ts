/**
 * Route Collector
 *
 * Собирает роуты из контроллеров используя метаданные декораторов
 */

import type { Constructor } from "@ambrosia/core";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";
import { normalize } from "./path-matcher.ts";
import { RouteMetadata } from "./route-metadata.ts";

/**
 * Route Collector класс
 *
 * Сканирует контроллеры и создает RouteMetadata для каждого endpoint'а
 */
export class RouteCollector {
  /**
   * Собирает все роуты из всех зарегистрированных контроллеров
   *
   * @returns Массив RouteMetadata
   *
   * @example
   * const routes = RouteCollector.collectAll();
   * console.log(`Found ${routes.length} routes`);
   */
  static collectAll(): RouteMetadata[] {
    const controllers = HttpMetadataManager.getAllControllers();
    const allRoutes: RouteMetadata[] = [];

    for (const controller of controllers) {
      const routes = RouteCollector.collectFromController(controller);
      allRoutes.push(...routes);
    }

    return allRoutes;
  }

  /**
   * Собирает роуты из конкретного контроллера
   *
   * @param controller - Класс контроллера
   * @returns Массив RouteMetadata
   *
   * @example
   * const routes = RouteCollector.collectFromController(UserController);
   */
  static collectFromController(controller: Constructor): RouteMetadata[] {
    // Получаем метаданные контроллера
    const controllerMetadata = HttpMetadataManager.getController(controller);
    if (!controllerMetadata) {
      return [];
    }

    // Получаем все методы роутов
    const routeMethods = HttpMetadataManager.getRouteMethods(controller);
    if (routeMethods.length === 0) {
      return [];
    }

    const routes: RouteMetadata[] = [];

    // Для каждого метода роута создаем RouteMetadata
    for (const routeMethod of routeMethods) {
      // Комбинируем пути контроллера с путями метода
      const fullPaths = RouteCollector.combinePaths(controllerMetadata.path, routeMethod.path);

      // Получаем метаданные параметров
      const parameters = HttpMetadataManager.getParameters(controller, routeMethod.methodName);

      // Получаем функцию-обработчик
      const handler = controller.prototype[routeMethod.methodName];

      // Создаем RouteMetadata для каждой комбинации путей
      for (const fullPath of fullPaths) {
        routes.push(
          new RouteMetadata({
            method: routeMethod.method,
            path: fullPath,
            handler,
            controllerClass: controller,
            methodName: routeMethod.methodName,
            parameters,
          }),
        );
      }
    }

    return routes;
  }

  /**
   * Комбинирует пути контроллера с путями метода
   *
   * Создает cartesian product всех комбинаций
   *
   * @param controllerPaths - Пути контроллера
   * @param methodPaths - Пути метода
   * @returns Массив комбинированных путей
   *
   * @example
   * combinePaths(['/api', '/v1'], ['/', '/list'])
   * → ['/api', '/api/list', '/v1', '/v1/list']
   *
   * combinePaths(['/users'], ['/:id'])
   * → ['/users/:id']
   */
  static combinePaths(controllerPaths: string[], methodPaths: string[]): string[] {
    const combined: string[] = [];

    for (const controllerPath of controllerPaths) {
      for (const methodPath of methodPaths) {
        combined.push(RouteCollector.joinPaths(controllerPath, methodPath));
      }
    }

    return combined;
  }

  /**
   * Объединяет два пути
   *
   * @param base - Базовый путь
   * @param path - Путь для добавления
   * @returns Объединенный путь
   *
   * @example
   * joinPaths('/api/users', '/') → '/api/users'
   * joinPaths('/api/users', '/:id') → '/api/users/:id'
   * joinPaths('/api', '/users') → '/api/users'
   * joinPaths('/', '/users') → '/users'
   */
  static joinPaths(base: string, path: string): string {
    // Нормализуем оба пути
    const normalizedBase = normalize(base);
    const normalizedPath = normalize(path);

    // Если method path это корень, возвращаем base
    if (normalizedPath === "/") {
      return normalizedBase;
    }

    // Если base это корень, возвращаем path
    if (normalizedBase === "/") {
      return normalizedPath;
    }

    // Объединяем
    return normalizedBase + normalizedPath;
  }
}
