import { definePack } from "@ambrosia-unce/core";
import { CacheService } from "./cache.service.ts";

export const CachePack = definePack({
  meta: { name: "cache" },
  providers: [CacheService],
  exports: [CacheService],
});
