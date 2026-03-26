/**
 * Injection tokens for @ambrosia-unce/config
 */

import { InjectionToken } from "@ambrosia-unce/core";
import type { ConfigSchema } from "./types.ts";

/** Injection token for the parsed config values Map */
export const CONFIG_VALUES = new InjectionToken<Map<string, unknown>>("CONFIG_VALUES");

/** Injection token for the config schema definition */
export const CONFIG_SCHEMA = new InjectionToken<ConfigSchema>("CONFIG_SCHEMA");
