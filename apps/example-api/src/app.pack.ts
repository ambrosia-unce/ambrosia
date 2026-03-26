import { ConfigModule } from "@ambrosia/config";
import { LoggerModule } from "@ambrosia/core";
import { DevToolsPack } from "@ambrosia/devtools";
import { EventBusModule } from "@ambrosia/events";
import type { HttpPackDefinition } from "@ambrosia/http";
import { AuthPack } from "./auth/auth.pack.ts";
import { NotificationListener } from "./common/events/notification.listener.ts";
import { AppConfig } from "./config/app.config.ts";
import { TaskPack } from "./tasks/task.pack.ts";
import { UserPack } from "./users/user.pack.ts";
import { NotificationPack } from "./notifications/notification.pack.ts";
import { CachePack } from "./cache/cache.pack.ts";
import { AnalyticsPack } from "./analytics/analytics.pack.ts";
import { AuditPack } from "./audit/audit.pack.ts";
import { HealthPack } from "./health/health.pack.ts";

/**
 * Root application pack — composes all feature packs.
 *
 * Dependency graph:
 *   app
 *   ├── @ambrosia/config
 *   ├── @ambrosia/events
 *   ├── devtools
 *   ├── auth
 *   ├── users
 *   ├── tasks
 *   ├── notifications
 *   ├── cache
 *   ├── analytics → cache
 *   ├── audit → notifications, cache
 *   └── health → cache
 */
export const AppPack: HttpPackDefinition = {
  meta: { name: "app" },
  imports: [
    DevToolsPack.forRoot({ enabled: true }),
    LoggerModule.forRoot(),
    ConfigModule.forRoot({
      schema: AppConfig,
      validate: false,
    }),
    EventBusModule.forRoot(),
    AuthPack,
    CachePack,
    NotificationPack,
    AnalyticsPack,   // → cache
    AuditPack,       // → notifications, cache
    HealthPack,      // → cache (HTTP)
    UserPack,
    TaskPack,
  ],
  providers: [NotificationListener],
};
