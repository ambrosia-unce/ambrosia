import { definePack } from "@ambrosia/core";
import { NotificationService } from "./notification.service.ts";

export const NotificationPack = definePack({
  meta: { name: "notifications" },
  providers: [NotificationService],
  exports: [NotificationService],
});
