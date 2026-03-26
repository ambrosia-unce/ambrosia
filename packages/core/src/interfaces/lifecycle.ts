/**
 * Lifecycle interfaces for @Injectable classes.
 *
 * Implement OnInit/OnDestroy on any @Injectable class to hook into
 * the instance lifecycle managed by the DI container.
 */

/**
 * Called after the instance is created and all dependencies injected.
 *
 * - Sync onInit() works with both resolve() and resolveAsync().
 * - Async onInit() requires resolveAsync(). Calling resolve() on a class
 *   with async onInit() will throw an error.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class DatabaseService implements OnInit {
 *   constructor(@Inject(DB_CONFIG) private config: DbConfig) {}
 *
 *   async onInit() {
 *     await this.connect(this.config);
 *   }
 * }
 * ```
 */
export interface OnInit {
  onInit(): void | Promise<void>;
}

/**
 * Called when the container is being destroyed (container.destroyAll() or app.close()).
 * Executed in reverse order (LIFO) — last created, first destroyed.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class DatabaseService implements OnDestroy {
 *   async onDestroy() {
 *     await this.connection.close();
 *   }
 * }
 * ```
 */
export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

export function hasOnInit(instance: unknown): instance is OnInit {
  return instance != null && typeof (instance as OnInit).onInit === "function";
}

export function hasOnDestroy(instance: unknown): instance is OnDestroy {
  return instance != null && typeof (instance as OnDestroy).onDestroy === "function";
}
