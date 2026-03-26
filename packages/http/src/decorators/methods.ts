/**
 * HTTP Method Decorators
 *
 * Декораторы для определения HTTP методов (@Get, @Post, @Put, @Delete, @Patch)
 * Организованы через namespace Http для удобства
 */

import type { Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata";
import { normalize } from "../routing/path-matcher.ts";
import type { HttpMethod, RouteMethodMetadata, RouteOptions } from "../types";

/**
 * Нормализует пути
 */
function normalizePaths(paths: string | string[] | undefined): string[] {
  if (!paths) {
    return ["/"];
  }
  const pathArray = Array.isArray(paths) ? paths : [paths];
  return pathArray.map(normalize);
}

/**
 * Создает декоратор HTTP метода
 */
function createMethodDecorator(method: HttpMethod) {
  return (pathOrOptions?: string | string[] | RouteOptions): MethodDecorator =>
    (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const constructor = target.constructor as Constructor;

      // Парсим аргументы
      let paths: string[];

      if (typeof pathOrOptions === "string") {
        paths = normalizePaths(pathOrOptions);
      } else if (Array.isArray(pathOrOptions)) {
        paths = normalizePaths(pathOrOptions);
      } else if (pathOrOptions && "path" in pathOrOptions) {
        // RouteOptions
        paths = normalizePaths(pathOrOptions.path);
      } else {
        // Не указан путь
        paths = ["/"];
      }

      // Создаем метаданные метода
      const metadata: RouteMethodMetadata = {
        method,
        path: paths,
        methodName: propertyKey,
        target: constructor,
      };

      // Сохраняем метаданные
      HttpMetadataManager.addRouteMethod(constructor, propertyKey, metadata);

      return descriptor;
    };
}

/**
 * HTTP namespace для организации декораторов
 *
 * Использование:
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Http.Get('/')
 *   list() {}
 *
 *   @Http.Post('/')
 *   create(@Body() body: any) {}
 *
 *   @Http.Get('/:id')
 *   getOne(@Param('id') id: string) {}
 * }
 * ```
 */
export namespace Http {
  /**
   * @Get decorator - определяет GET endpoint
   *
   * @param path - Путь или массив путей (опционально, по умолчанию "/")
   *
   * @example
   * ```typescript
   * @Http.Get('/')
   * list() {}
   *
   * @Http.Get('/:id')
   * getOne(@Param('id') id: string) {}
   *
   * @Http.Get(['/', '/list'])
   * listUsers() {}
   * ```
   */
  export function Get(path?: string | string[]): MethodDecorator;
  export function Get(options?: RouteOptions): MethodDecorator;
  export function Get(pathOrOptions?: string | string[] | RouteOptions): MethodDecorator {
    return createMethodDecorator("GET")(pathOrOptions);
  }

  /**
   * @Post decorator - определяет POST endpoint
   *
   * @param path - Путь или массив путей (опционально, по умолчанию "/")
   *
   * @example
   * ```typescript
   * @Http.Post('/')
   * create(@Body() body: any) {}
   * ```
   */
  export function Post(path?: string | string[]): MethodDecorator;
  export function Post(options?: RouteOptions): MethodDecorator;
  export function Post(pathOrOptions?: string | string[] | RouteOptions): MethodDecorator {
    return createMethodDecorator("POST")(pathOrOptions);
  }

  /**
   * @Put decorator - определяет PUT endpoint
   *
   * @param path - Путь или массив путей (опционально, по умолчанию "/")
   *
   * @example
   * ```typescript
   * @Http.Put('/:id')
   * update(@Param('id') id: string, @Body() body: any) {}
   * ```
   */
  export function Put(path?: string | string[]): MethodDecorator;
  export function Put(options?: RouteOptions): MethodDecorator;
  export function Put(pathOrOptions?: string | string[] | RouteOptions): MethodDecorator {
    return createMethodDecorator("PUT")(pathOrOptions);
  }

  /**
   * @Delete decorator - определяет DELETE endpoint
   *
   * @param path - Путь или массив путей (опционально, по умолчанию "/")
   *
   * @example
   * ```typescript
   * @Http.Delete('/:id')
   * remove(@Param('id') id: string) {}
   * ```
   */
  export function Delete(path?: string | string[]): MethodDecorator;
  export function Delete(options?: RouteOptions): MethodDecorator;
  export function Delete(pathOrOptions?: string | string[] | RouteOptions): MethodDecorator {
    return createMethodDecorator("DELETE")(pathOrOptions);
  }

  /**
   * @Patch decorator - определяет PATCH endpoint
   *
   * @param path - Путь или массив путей (опционально, по умолчанию "/")
   *
   * @example
   * ```typescript
   * @Http.Patch('/:id')
   * partialUpdate(@Param('id') id: string, @Body() body: any) {}
   * ```
   */
  export function Patch(path?: string | string[]): MethodDecorator;
  export function Patch(options?: RouteOptions): MethodDecorator;
  export function Patch(pathOrOptions?: string | string[] | RouteOptions): MethodDecorator {
    return createMethodDecorator("PATCH")(pathOrOptions);
  }
}
