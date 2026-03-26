/**
 * Exception Filter Interface
 *
 * Exception Filters перехватывают исключения и форматируют ответ.
 * Позволяют централизованно обрабатывать ошибки.
 */

import type { HttpContext } from "../context/http-context.ts";

/**
 * Аргументы для обработки исключения
 */
export interface ExceptionFilterArgs {
  /**
   * Исключение
   */
  exception: any;

  /**
   * HTTP контекст
   */
  httpContext: HttpContext;
}

/**
 * Exception Filter Interface
 *
 * Реализуйте этот интерфейс для создания custom exception filter'ов
 *
 * @example
 * ```typescript
 * @Injectable()
 * class HttpExceptionFilter implements ExceptionFilter {
 *   catch(args: ExceptionFilterArgs): any {
 *     const { exception, httpContext } = args;
 *
 *     const status = exception.status || 500;
 *     const message = exception.message || 'Internal server error';
 *
 *     return {
 *       statusCode: status,
 *       timestamp: new Date().toISOString(),
 *       path: httpContext.request.path,
 *       message,
 *     };
 *   }
 * }
 * ```
 */
export interface ExceptionFilter<T = any> {
  /**
   * Обрабатывает исключение
   *
   * @param args - Аргументы с исключением и контекстом
   * @returns Ответ (обычно объект с ошибкой)
   */
  catch(args: ExceptionFilterArgs): T | Promise<T>;
}

/**
 * Type для Exception Filter класса или инстанса
 */
export type ExceptionFilterType = ExceptionFilter | (new (...args: any[]) => ExceptionFilter);
