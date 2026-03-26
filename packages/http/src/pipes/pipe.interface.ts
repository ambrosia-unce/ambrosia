/**
 * Pipe Interface
 *
 * Pipes трансформируют и валидируют входные данные перед передачей в handler.
 * Используются для:
 * - Валидации данных
 * - Трансформации данных (string → number)
 * - Санитизации входных данных
 */

/**
 * Метаданные для валидации параметра
 */
export interface PipeMetadata {
  /**
   * Тип параметра (для transform pipes)
   */
  type?: any;

  /**
   * Дополнительные данные
   */
  data?: any;
}

/**
 * Pipe Interface
 *
 * Реализуйте этот интерфейс для создания custom pipe'ов
 *
 * @example
 * Валидация:
 * ```typescript
 * @Injectable()
 * class ValidationPipe implements Pipe {
 *   transform(value: any, metadata: PipeMetadata): any {
 *     if (!value) {
 *       throw new Error('Validation failed: value is required');
 *     }
 *     return value;
 *   }
 * }
 * ```
 *
 * @example
 * Трансформация:
 * ```typescript
 * @Injectable()
 * class ParseIntPipe implements Pipe {
 *   transform(value: string, metadata: PipeMetadata): number {
 *     const val = parseInt(value, 10);
 *     if (isNaN(val)) {
 *       throw new Error('Validation failed: not a number');
 *     }
 *     return val;
 *   }
 * }
 * ```
 */
export interface Pipe<T = any, R = any> {
  /**
   * Трансформирует/валидирует значение
   *
   * @param value - Входное значение
   * @param metadata - Метаданные для обработки
   * @returns Трансформированное значение
   * @throws Error если валидация не прошла
   */
  transform(value: T, metadata?: PipeMetadata): R | Promise<R>;
}

/**
 * Type для Pipe класса или инстанса
 */
export type PipeType = Pipe | (new (...args: any[]) => Pipe);
