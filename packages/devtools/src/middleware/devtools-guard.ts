/**
 * DevToolsGuard — protects DevTools endpoints.
 *
 * Only allows access when DevTools is enabled.
 * Optionally checks an auth token for remote access.
 */

import { Inject, Injectable, Optional } from "@ambrosia/core";
import type { ExecutionContext, Guard } from "@ambrosia/http";
import { DEVTOOLS_OPTIONS } from "../tokens.ts";
import type { DevToolsOptions } from "../types.ts";

@Injectable()
export class DevToolsGuard implements Guard {
  constructor(
    @Inject(DEVTOOLS_OPTIONS)
    @Optional()
    private readonly options?: DevToolsOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // If DevTools is explicitly disabled, deny access
    if (this.options?.enabled === false) {
      return false;
    }

    // If an auth token is configured, require it in the request header
    if (this.options?.authToken) {
      const http = context.switchToHttp();
      const request = http.getRequest();
      const token = request.headers["x-devtools-token"];

      if (typeof token === "string") {
        return token === this.options.authToken;
      }
      if (Array.isArray(token)) {
        return token.includes(this.options.authToken);
      }

      return false;
    }

    return true;
  }
}
