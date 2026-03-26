/**
 * DevTools UI Controller
 *
 * Serves the DevTools React SPA at /_devtools/*.
 * Static assets (JS/CSS) from dist/ui/ and fallback to index.html for SPA routing.
 */

import { Controller, Http, Req, UseGuard } from "@ambrosia/http";
import { DevToolsGuard } from "./middleware/devtools-guard.ts";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/ui/ is adjacent to dist/ where this compiled file lives
const UI_DIR = join(__dirname, "ui");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."));
  return MIME_TYPES[ext] || "application/octet-stream";
}

@Controller("/_devtools")
@UseGuard(DevToolsGuard)
export class DevToolsController {
  /**
   * GET /_devtools/assets/*
   * Serve static assets (JS, CSS) with caching.
   */
  @Http.Get("/assets/*")
  async serveAsset(@Req() req: Request) {
    const url = new URL(req.url);
    const assetPath = url.pathname.replace("/_devtools/", "");
    const filePath = join(UI_DIR, assetPath);

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": getMimeType(filePath),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * GET /_devtools (root without trailing slash)
   */
  @Http.Get("/")
  async serveRoot() {
    return this.serveUI();
  }

  /**
   * GET /_devtools/*
   * SPA fallback — serve index.html for all non-asset routes.
   */
  @Http.Get("/*")
  async serveUI() {
    const indexPath = join(UI_DIR, "index.html");
    const file = Bun.file(indexPath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Fallback if UI not built
    return new Response(
      `<html><body style="background:#0a0f14;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh">
        <div style="text-align:center">
          <h1>Ambrosia DevTools</h1>
          <p style="color:#888">UI not built. Run: cd packages/devtools/ui && bun run build</p>
          <p style="margin-top:1rem"><a href="/_devtools/api/overview" style="color:#5cc8e6">API Overview →</a></p>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
