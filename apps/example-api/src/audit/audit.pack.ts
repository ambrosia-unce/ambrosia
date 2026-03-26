import { definePack } from "@ambrosia-unce/core";
import { AuditService } from "./audit.service.ts";
import { NotificationPack } from "../notifications/notification.pack.ts";
import { CachePack } from "../cache/cache.pack.ts";

// Audit depends on Notifications (sends alerts) and Cache (rate-limiting)
export const AuditPack = definePack({
  meta: { name: "audit" },
  imports: [NotificationPack, CachePack],
  providers: [AuditService],
  exports: [AuditService],
});
