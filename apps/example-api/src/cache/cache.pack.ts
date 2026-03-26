import { definePack } from "@ambrosia/core";
import { CacheService } from "./cache.service.ts";

export const CachePack = definePack({
  meta: { name: "cache" },
  providers: [CacheService],
  exports: [CacheService],
});
