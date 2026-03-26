import type { HttpPackDefinition } from "@ambrosia-unce/http";
import { HealthController } from "./health.controller.ts";
import { CachePack } from "../cache/cache.pack.ts";

// Health depends on Cache (for health check caching)
export const HealthPack: HttpPackDefinition = {
  meta: { name: "health" },
  imports: [CachePack],
  providers: [],
  controllers: [HealthController],
};
