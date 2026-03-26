/**
 * CallHandler for interceptor chain
 *
 * Allows interceptors to control the execution flow
 */

/**
 * CallHandler interface
 *
 * Represents the next interceptor or handler in the chain
 */
export interface CallHandler<T = any> {
  /**
   * Call the next interceptor or the route handler
   *
   * @returns Promise resolving to the handler result
   */
  handle(): Promise<T>;
}

/**
 * CallHandler implementation
 */
export class CallHandlerImpl<T = any> implements CallHandler<T> {
  constructor(private next: () => Promise<T>) {}

  async handle(): Promise<T> {
    return this.next();
  }
}
