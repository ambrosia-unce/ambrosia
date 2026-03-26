/**
 * Guard Interface
 *
 * Guards определяют может ли запрос быть обработан endpoint'ом.
 * Используются для авторизации, аутентификации и других проверок доступа.
 */

import type { ExecutionContext } from "../context/execution-context.ts";

/**
 * Guard Interface
 *
 * Реализуйте этот интерфейс для создания custom guard'ов
 *
 * @example
 * ```typescript
 * @Injectable()
 * class AuthGuard implements Guard {
 *   canActivate(context: ExecutionContext): boolean | Promise<boolean> {
 *     const http = context.switchToHttp();
 *     const token = http.getRequest().headers['authorization'];
 *     return !!token && this.validateToken(token);
 *   }
 * }
 * ```
 */
export interface Guard {
  /**
   * Определяет может ли запрос быть обработан
   *
   * @param context - Контекст выполнения
   * @returns true если запрос разрешен, false - если запрещен
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * Type для Guard класса или инстанса
 */
export type GuardType = Guard | (new (...args: any[]) => Guard);
