import { Injectable } from "@ambrosia-unce/core";
import { ConfigService } from "@ambrosia-unce/config";
import type { ExecutionContext, Guard } from "@ambrosia-unce/http";
import { UnauthorizedException } from "@ambrosia-unce/http";

/**
 * Simple token-based auth guard.
 *
 * Checks the Authorization header for a Bearer token.
 * Accepts any non-empty token for demo purposes.
 * Stores extracted user info on the execution context metadata.
 */
@Injectable()
export class AuthGuard implements Guard {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Allow bypassing auth via config
    const authEnabled = this.config.get<boolean>("authEnabled");
    if (authEnabled === false) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid Authorization format. Use: Bearer <token>");
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException("Empty bearer token");
    }

    // In a real app, you would validate the JWT here.
    // For demo purposes, we accept any non-empty token
    // and extract a simple user identity from it.
    context.setMetadata("userId", token);
    context.setMetadata("authenticated", true);

    return true;
  }
}
