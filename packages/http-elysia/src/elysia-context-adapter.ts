import type { CookieOptions, HttpMethod, IHttpRequest, IHttpResponse } from "@ambrosia-unce/http";
import { HttpContext } from "@ambrosia-unce/http";

/**
 * Adapts native Elysia context into Ambrosia HttpContext.
 */
export class ElysiaContextAdapter {
  /**
   * Convert Elysia handler context to HttpContext
   */
  static adapt(ctx: any): HttpContext {
    const url = new URL(ctx.request.url);
    const params: Record<string, string> = ctx.params || {};

    const request: IHttpRequest = {
      method: ctx.request.method.toUpperCase() as HttpMethod,
      url: ctx.request.url,
      path: url.pathname,
      headers: ElysiaContextAdapter.extractHeaders(ctx),
      query: ElysiaContextAdapter.extractQuery(url),
      body: ctx.body,
      ip:
        ctx.request.headers.get("x-forwarded-for") ||
        ctx.server?.requestIP?.(ctx.request)?.address ||
        "127.0.0.1",
      cookies: ElysiaContextAdapter.extractCookies(ctx),
      session: {},
      files: [],
      protocol: url.protocol.replace(":", "") as string,
      hostname: url.hostname,
    };

    const response = ElysiaContextAdapter.createResponse(ctx);

    return new HttpContext(request, response, params, ctx);
  }

  private static extractHeaders(ctx: any): Record<string, string | string[]> {
    const headers: Record<string, string | string[]> = {};
    const raw = ctx.request.headers;

    if (typeof raw.forEach === "function") {
      raw.forEach((value: string, key: string) => {
        headers[key.toLowerCase()] = value;
      });
    }

    return headers;
  }

  private static extractQuery(url: URL): Record<string, string | string[]> {
    const query: Record<string, string | string[]> = {};

    url.searchParams.forEach((value, key) => {
      const existing = query[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [existing, value];
        }
      } else {
        query[key] = value;
      }
    });

    return query;
  }

  private static extractCookies(ctx: any): Record<string, string> {
    const cookies: Record<string, string> = {};
    const header = ctx.request.headers.get("cookie");
    if (!header) return cookies;

    for (const pair of header.split(";")) {
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val; // fallback if not URI-encoded
      }
    }

    return cookies;
  }

  private static createResponse(ctx: any): IHttpResponse {
    const responseHeaders: Record<string, string> = {};
    let statusCode = 200;
    let responseBody: any = null;

    const response: IHttpResponse = {
      get status() {
        return statusCode;
      },
      set status(code: number) {
        statusCode = code;
        ctx.set.status = code;
      },
      headers: responseHeaders,
      get body() {
        return responseBody;
      },
      set body(val: any) {
        responseBody = val;
      },

      setStatus(code: number) {
        statusCode = code;
        ctx.set.status = code;
        return response;
      },

      setHeader(name: string, value: string) {
        responseHeaders[name] = value;
        ctx.set.headers[name] = value;
        return response;
      },

      json(data: any) {
        responseBody = data;
        responseHeaders["content-type"] = "application/json";
        ctx.set.headers["content-type"] = "application/json";
        return response;
      },

      send(data: any) {
        responseBody = data;
        return response;
      },

      setCookie(name: string, value: string, options?: CookieOptions) {
        let cookie = `${name}=${encodeURIComponent(value)}`;

        if (options?.maxAge !== undefined)
          cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
        if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
        if (options?.path) cookie += `; Path=${options.path}`;
        if (options?.domain) cookie += `; Domain=${options.domain}`;
        if (options?.secure) cookie += "; Secure";
        if (options?.httpOnly) cookie += "; HttpOnly";
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;

        const existing = ctx.set.headers["set-cookie"];
        if (existing === undefined) {
          ctx.set.headers["set-cookie"] = cookie;
        } else if (Array.isArray(existing)) {
          existing.push(cookie);
        } else {
          ctx.set.headers["set-cookie"] = [existing, cookie];
        }
        return response;
      },

      redirect(url: string, status = 302) {
        statusCode = status;
        ctx.set.status = status;
        ctx.set.redirect = url;
        return response;
      },
    };

    return response;
  }
}
