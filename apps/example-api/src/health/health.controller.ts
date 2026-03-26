import { Controller, Http } from "@ambrosia/http";

@Controller("/health")
export class HealthController {
  @Http.Get("/")
  check() {
    return {
      status: "ok",
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  }

  @Http.Get("/ready")
  ready() {
    return { status: "ready" };
  }
}
