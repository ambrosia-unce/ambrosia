/**
 * PackLifecycleManager — manages pack onInit/onDestroy hooks.
 */

import { AMB103, createError } from "../errors/error-codes.ts";
import { printError } from "../errors/error-formatter.ts";
import type { IContainer } from "../interfaces/container.ts";
import { LoggerService } from "../logger/logger.service.ts";
import { globalLogger } from "../utils/logger.ts";
import type { PackDefinition } from "./types.ts";

interface PackHook {
  pack: PackDefinition;
  name: string;
}

export class PackLifecycleManager {
  private initHooks: PackHook[] = [];
  private destroyHooks: PackHook[] = [];

  register(pack: PackDefinition, name: string): void {
    if (pack.onInit) {
      this.initHooks.push({ pack, name });
    }
    if (pack.onDestroy) {
      this.destroyHooks.push({ pack, name });
    }
  }

  /**
   * Execute all onInit hooks in registration order.
   * Throws on error (pack init is critical).
   */
  async executeInit(container: IContainer): Promise<void> {
    // Try to resolve LoggerService if available, fallback to globalLogger
    let logger: { info(msg: string): void; error(msg: string): void; warn(msg: string): void } = globalLogger;
    try {
      const svc = container.resolve(LoggerService);
      if (svc) logger = svc.child("PackLifecycle");
    } catch {
      // LoggerService not registered yet — use globalLogger
    }

    for (const { pack, name } of this.initHooks) {
      try {
        await pack.onInit!(container);
        logger.info(`Pack initialized: ${name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const ambError = createError(
          AMB103,
          `Pack "${name}" onInit failed: ${message}`,
          { pack: name, cause: message },
        );
        printError(ambError);
        throw ambError;
      }
    }
  }

  /**
   * Execute all onDestroy hooks in reverse order (LIFO).
   * Does not throw — logs errors and continues (graceful shutdown).
   */
  async executeDestroy(): Promise<void> {
    for (let i = this.destroyHooks.length - 1; i >= 0; i--) {
      const hook = this.destroyHooks[i]!;
      const { pack, name } = hook;
      try {
        await pack.onDestroy!();
        globalLogger.info(`Pack destroyed: ${name}`); // Use globalLogger — container may be torn down
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        globalLogger.error(`Pack destroy failed: ${name} — ${message}`); // Use globalLogger — container may be torn down
      }
    }
  }
}
