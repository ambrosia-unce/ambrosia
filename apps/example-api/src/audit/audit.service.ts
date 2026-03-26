import { Injectable, LoggerService } from "@ambrosia/core";

@Injectable()
export class AuditService {
  private logs: Array<{ action: string; userId?: string; timestamp: number }> = [];

  constructor(private logger: LoggerService) {
    this.logger = logger.child("AuditService");
  }

  record(action: string, userId?: string) {
    const entry = { action, userId, timestamp: Date.now() };
    this.logs.push(entry);
    this.logger.info("Audit", entry);
  }

  getRecent(limit = 50) {
    return this.logs.slice(-limit);
  }
}
