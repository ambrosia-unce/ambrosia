import "reflect-metadata";

import { ConfigService } from "@ambrosia/config";
import { HttpApplication } from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";
import { AppPack } from "./app.pack.ts";
import { GlobalErrorFilter } from "./common/error.filter.ts";
import { LoggingInterceptor } from "./common/logging.interceptor.ts";

/**
 * Bootstrap the Ambrosia Example API.
 *
 * Demonstrates the full framework stack:
 *  - DI container with pack-based composition
 *  - HTTP controllers with Elysia adapter
 *  - Global interceptors (logging) and filters (error handling)
 *  - Config module with typed env vars
 *  - Event bus with domain events
 *  - Guards for route-level authentication
 */
const app = await HttpApplication.create({
  provider: ElysiaProvider,
  packs: [AppPack],
  globalInterceptors: [LoggingInterceptor],
  globalFilters: [GlobalErrorFilter],
});

const config = app.getContainer().resolve(ConfigService);
const port = config.get<number>("port") ?? 3000;
const appName = config.get<string>("appName") ?? "Ambrosia Example API";

await app.listen(port);

console.log(`\n  ${appName}`);
console.log(`  Listening on http://localhost:${port}\n`);
console.log("  Endpoints:");
console.log("    POST   /users              Create user");
console.log("    GET    /users              List users");
console.log("    GET    /users/:id          Get user");
console.log("    POST   /tasks              Create task (auth)");
console.log("    GET    /tasks              List tasks (?status=)");
console.log("    GET    /tasks/:id          Get task");
console.log("    PATCH  /tasks/:id          Update task (auth)");
console.log("    DELETE /tasks/:id          Delete task (auth)");
console.log("    PATCH  /tasks/:id/complete Complete task (auth)\n");
