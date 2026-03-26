import type { HttpProvider, RouteConfig } from "@ambrosia/http";
import { Elysia } from "elysia";
import { ElysiaContextAdapter } from "./elysia-context-adapter.ts";

/**
 * Elysia.js HTTP provider for Ambrosia framework.
 *
 * Adapts Elysia to the HttpProvider interface so it can be used
 * with HttpApplication.create({ provider: ElysiaProvider }).
 */
export class ElysiaProvider implements HttpProvider<Elysia, any> {
  readonly name = "elysia";
  private app: Elysia;

  constructor() {
    this.app = new Elysia();
  }

  getNativeApp(): Elysia {
    return this.app;
  }

  registerRoute(config: RouteConfig): void {
    const handler = async (ctx: any) => {
      const httpContext = ElysiaContextAdapter.adapt(ctx);
      return config.handler(httpContext);
    };

    switch (config.method) {
      case "GET":
        this.app.get(config.path, handler);
        break;
      case "POST":
        this.app.post(config.path, handler);
        break;
      case "PUT":
        this.app.put(config.path, handler);
        break;
      case "PATCH":
        this.app.patch(config.path, handler);
        break;
      case "DELETE":
        this.app.delete(config.path, handler);
        break;
      case "OPTIONS":
        this.app.options(config.path, handler);
        break;
      case "HEAD":
        this.app.head(config.path, handler);
        break;
    }
  }

  use(middleware: any): void {
    this.app.use(middleware);
  }

  async listen(port: number): Promise<void> {
    this.app.listen(port);
  }

  async close(): Promise<void> {
    await this.app.stop();
  }
}
