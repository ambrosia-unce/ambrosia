export function healthController(): string {
  return `import { Controller, Http } from "@ambrosia/http";
import { HealthService } from "./health.service";

@Controller("/health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Http.Get("/")
  check() {
    return this.healthService.check();
  }

  @Http.Get("/ready")
  readiness() {
    return this.healthService.checkReadiness();
  }
}
`;
}

export function healthService(): string {
  return `import { Injectable } from "@ambrosia/core";

@Injectable()
export class HealthService {
  private readonly startedAt = new Date();

  check() {
    return {
      status: "ok",
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
    };
  }

  checkReadiness() {
    return {
      status: "ready",
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
  }
}
`;
}
