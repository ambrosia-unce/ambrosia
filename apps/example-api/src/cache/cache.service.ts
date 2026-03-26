import { Injectable, LoggerService } from "@ambrosia-unce/core";

@Injectable()
export class CacheService {
  private store = new Map<string, { value: unknown; expires: number }>();

  constructor(private logger: LoggerService) {
    this.logger = logger.child("CacheService");
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs = 60_000): void {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
    this.logger.debug("Cache set", { key, ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}
