import { definePack } from "@ambrosia/core";
import { AnalyticsService } from "./analytics.service.ts";
import { CachePack } from "../cache/cache.pack.ts";

// Analytics depends on Cache
export const AnalyticsPack = definePack({
  meta: { name: "analytics" },
  imports: [CachePack],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
});
