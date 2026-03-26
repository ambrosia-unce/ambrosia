/**
 * Injection tokens for @ambrosia/devtools
 */

import { InjectionToken } from "@ambrosia/core";
import type { DevToolsOptions } from "./types.ts";

/**
 * Token for DevTools configuration options.
 */
export const DEVTOOLS_OPTIONS = new InjectionToken<DevToolsOptions>("DEVTOOLS_OPTIONS");

/**
 * Token for the SSE event emitter used to broadcast live events.
 */
export const DEVTOOLS_EVENT_EMITTER = new InjectionToken<DevToolsEventEmitterToken>(
  "DEVTOOLS_EVENT_EMITTER",
);

/**
 * Placeholder type — actual interface is in types.ts.
 * This avoids circular imports while keeping the token typed.
 */
type DevToolsEventEmitterToken = import("./types.ts").DevToolsEventEmitter;
