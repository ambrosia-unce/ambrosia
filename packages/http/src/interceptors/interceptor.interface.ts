/**
 * Interceptor Interface
 *
 * Interceptors перехватывают выполнение запроса до и после вызова handler'а.
 * Используются для:
 * - Логирования
 * - Трансформации ответа
 * - Кеширования
 * - Измерения времени выполнения
 * - Модификации request/response
 */

import type { CallHandler } from "../context/call-handler.ts";
import type { ExecutionContext } from "../context/execution-context.ts";

/**
 * Interceptor Interface
 *
 * Реализуйте этот интерфейс для создания custom interceptor'ов
 *
 * @example
 * Логирование:
 * ```typescript
 * @Injectable()
 * class LoggingInterceptor implements Interceptor {
 *   async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
 *     console.log('Before...');
 *     const now = Date.now();
 *     const result = await next.handle();
 *     console.log(`After... ${Date.now() - now}ms`);
 *     return result;
 *   }
 * }
 * ```
 *
 * @example
 * Трансформация ответа:
 * ```typescript
 * @Injectable()
 * class TransformInterceptor implements Interceptor {
 *   async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
 *     const result = await next.handle();
 *     return {
 *       success: true,
 *       data: result,
 *       timestamp: new Date().toISOString()
 *     };
 *   }
 * }
 * ```
 */
export interface Interceptor<T = any, R = any> {
  /**
   * Перехватывает выполнение
   *
   * @param context - Контекст выполнения
   * @param next - CallHandler для вызова следующего в chain'е
   * @returns Результат (может быть модифицированным)
   */
  intercept(context: ExecutionContext, next: CallHandler<T>): Promise<R>;
}

/**
 * Type для Interceptor класса или инстанса
 */
export type InterceptorType = Interceptor | (new (...args: any[]) => Interceptor);
