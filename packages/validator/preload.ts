/**
 * Preload script for @ambrosia/validator plugin
 *
 * Add this to your bunfig.toml:
 * ```toml
 * preload = ["@ambrosia/validator/preload"]
 * ```
 *
 * Or with custom options:
 * ```toml
 * preload = ["./validator-config.ts"]
 * ```
 *
 * And in validator-config.ts:
 * ```typescript
 * import { plugin } from "bun";
 * import { createValidatorPlugin } from "@ambrosia/validator/plugin";
 *
 * plugin(createValidatorPlugin({ debug: true }));
 * ```
 */

import { plugin } from "bun";
import { validatorPlugin } from "./src/plugin";

// Register plugin with default options
plugin(validatorPlugin);

if (process.env.DEBUG || process.env.AMBROSIA_DEBUG) {
  console.log("✓ @ambrosia/validator plugin loaded");
}
