/**
 * Error Codes Catalog — all known Ambrosia error codes with messages and hints.
 *
 * Code ranges:
 * - AMB001–AMB099: DI / Container errors
 * - AMB100–AMB199: Pack errors
 * - AMB200–AMB299: HTTP errors
 * - AMB300–AMB399: Config errors
 * - AMB400–AMB499: Event errors
 */

import { AmbrosiaError } from "./ambrosia-error.ts";

// ─── Error Definition Type ────────────────────────────────────────────────

export interface ErrorDefinition {
  code: string;
  message: string;
  hint: string;
}

// ─── DI Errors (AMB001–AMB099) ───────────────────────────────────────────

export const AMB001: ErrorDefinition = {
  code: "AMB001",
  message: "Provider not found",
  hint: "Make sure the class is listed in the `providers` array of a pack that is imported, or add the @Injectable() decorator.",
};

export const AMB002: ErrorDefinition = {
  code: "AMB002",
  message: "Circular dependency detected",
  hint: "Use @Autowired for property injection or enable `autoResolveCircular: true` in container options.",
};

export const AMB003: ErrorDefinition = {
  code: "AMB003",
  message: "Missing @Injectable decorator",
  hint: "Add the @Injectable() decorator to the class before using it as a provider.",
};

export const AMB004: ErrorDefinition = {
  code: "AMB004",
  message: "Missing @Inject decorator",
  hint: "Add @Inject(Token) to the constructor parameter when the type cannot be inferred via reflect-metadata.",
};

export const AMB005: ErrorDefinition = {
  code: "AMB005",
  message: "Scope mismatch",
  hint: "A singleton provider cannot depend on a request-scoped provider. Change the scope or use a factory with explicit resolution.",
};

export const AMB006: ErrorDefinition = {
  code: "AMB006",
  message: "Duplicate provider",
  hint: "The same token is registered twice in the same pack. Remove the duplicate or use a different token.",
};

export const AMB007: ErrorDefinition = {
  code: "AMB007",
  message: "Missing export",
  hint: "The provider is not exported from its pack. Add the token to the pack's `exports` array.",
};

// ─── Pack Errors (AMB100–AMB199) ─────────────────────────────────────────

export const AMB100: ErrorDefinition = {
  code: "AMB100",
  message: "Pack import cycle",
  hint: "Use `lazyImports` to break circular pack imports.",
};

export const AMB101: ErrorDefinition = {
  code: "AMB101",
  message: "Pack not found",
  hint: "Check that the imported pack is defined and exported correctly.",
};

export const AMB102: ErrorDefinition = {
  code: "AMB102",
  message: "Missing provider in pack",
  hint: "The provider listed in the pack definition could not be found. Verify the class exists and is imported.",
};

export const AMB103: ErrorDefinition = {
  code: "AMB103",
  message: "Pack onInit failed",
  hint: "The pack's onInit lifecycle hook threw an error. Check the hook implementation.",
};

// ─── HTTP Errors (AMB200–AMB299) ─────────────────────────────────────────

export const AMB200: ErrorDefinition = {
  code: "AMB200",
  message: "Route conflict",
  hint: "Two handlers are registered for the same HTTP method and path. Rename one of the routes.",
};

export const AMB201: ErrorDefinition = {
  code: "AMB201",
  message: "Missing controller decorator",
  hint: "Add the @Controller() decorator to the class used as a controller.",
};

export const AMB202: ErrorDefinition = {
  code: "AMB202",
  message: "Guard injection failed",
  hint: "The guard class could not be resolved. Ensure it is @Injectable() and registered in a pack.",
};

export const AMB203: ErrorDefinition = {
  code: "AMB203",
  message: "Invalid parameter decorator",
  hint: "Unknown parameter source in route handler. Use @Body(), @Query(), @Param(), etc.",
};

export const AMB204: ErrorDefinition = {
  code: "AMB204",
  message: "Handler timeout",
  hint: "The request handler exceeded the configured timeout. Increase @Timeout() or optimize the handler.",
};

// ─── Config Errors (AMB300–AMB399) ───────────────────────────────────────

export const AMB300: ErrorDefinition = {
  code: "AMB300",
  message: "Missing required env var",
  hint: "Set the required environment variable or provide a default value in the config schema.",
};

export const AMB301: ErrorDefinition = {
  code: "AMB301",
  message: "Invalid env value",
  hint: "The environment variable value could not be parsed to the expected type. Check the value format.",
};

export const AMB302: ErrorDefinition = {
  code: "AMB302",
  message: "Config schema invalid",
  hint: "The config schema definition has errors. Review the schema structure.",
};

// ─── Event Errors (AMB400–AMB499) ────────────────────────────────────────

export const AMB400: ErrorDefinition = {
  code: "AMB400",
  message: "Event handler not injectable",
  hint: "Add @Injectable() to the class that uses @OnEvent.",
};

export const AMB401: ErrorDefinition = {
  code: "AMB401",
  message: "EventBus not initialized",
  hint: "Ensure packs are processed before emitting events. Call HttpApplication.create() or PackProcessor.process() first.",
};

// ─── Error Catalog ───────────────────────────────────────────────────────

/** All error definitions keyed by code */
export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  AMB001,
  AMB002,
  AMB003,
  AMB004,
  AMB005,
  AMB006,
  AMB007,
  AMB100,
  AMB101,
  AMB102,
  AMB103,
  AMB200,
  AMB201,
  AMB202,
  AMB203,
  AMB204,
  AMB300,
  AMB301,
  AMB302,
  AMB400,
  AMB401,
};

// ─── Factory helpers ─────────────────────────────────────────────────────

/**
 * Create an AmbrosiaError from a catalog definition.
 *
 * @param def - The error definition from the catalog
 * @param detail - Additional detail appended to the message
 * @param context - Extra context data for debugging
 *
 * @example
 * ```ts
 * throw createError(AMB001, `Token "UserService" not found in pack "AppPack"`, {
 *   token: 'UserService',
 *   pack: 'AppPack',
 * });
 * ```
 */
export function createError(
  def: ErrorDefinition,
  detail?: string,
  context?: Record<string, unknown>,
): AmbrosiaError {
  const message = detail ? `${def.message}: ${detail}` : def.message;
  return new AmbrosiaError(def.code, message, def.hint, context);
}
