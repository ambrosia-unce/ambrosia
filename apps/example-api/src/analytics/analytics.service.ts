import { Injectable, LoggerService } from "@ambrosia/core";
import { CacheService } from "../cache/cache.service.ts";

@Injectable()
export class AnalyticsService {
  constructor(
    private logger: LoggerService,
    private cache: CacheService,
  ) {
    this.logger = logger.child("AnalyticsService");
  }

  track(event: string, properties?: Record<string, unknown>) {
    this.logger.info("Track event", { event, ...properties });
    const key = `analytics:${event}`;
    const count = (this.cache.get<number>(key) ?? 0) + 1;
    this.cache.set(key, count, 300_000);
  }

  getEventCount(event: string): number {
    return this.cache.get<number>(`analytics:${event}`) ?? 0;
  }
}
