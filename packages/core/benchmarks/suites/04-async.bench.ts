/**
 * Async Performance Benchmarks
 *
 * Compares sync vs async implementations:
 * - Sync Logger vs Async Logger
 * - Sync Plugin Manager vs Async Plugin Manager
 */

import { Container, Injectable } from "../../src/index.ts";
import { AsyncLogger } from "../../src/utils/async-logger.ts";
import { SilentLogger } from "../../src/utils/logger.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Test Classes ====================

@Injectable()
class TestService {
  value = 42;
}

// ==================== Benchmarks ====================

describe("Async: Logger Performance", () => {
  bench("silent logger (baseline - no overhead)", () => {
    const logger = new SilentLogger();
    logger.info("Test message", { data: "value" });
  });

  bench("async logger (buffered)", () => {
    const logger = new AsyncLogger({ bufferSize: 100, flushInterval: 100 });
    logger.info("Test message", { data: "value" });
  });

  bench("async logger with 10 messages", () => {
    const logger = new AsyncLogger({ bufferSize: 100, flushInterval: 100 });
    for (let i = 0; i < 10; i++) {
      logger.info("Test message", { data: "value", iteration: i });
    }
  });

  bench("async logger flush cycle", async () => {
    const logger = new AsyncLogger({ bufferSize: 10, flushInterval: 100 });

    // Fill buffer
    for (let i = 0; i < 10; i++) {
      logger.info("Test message", { iteration: i });
    }

    // Force flush
    await logger.forceFlush();
  });
});

describe("Async: Container with Logging", () => {
  bench("container with silent logger", () => {
    const container = new Container({ mode: "production" });
    container.resolve(TestService);
  });

  bench("container resolve 10x (no logging overhead)", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.resolve(TestService);
    }
  });
});

describe("Async: Buffer Management", () => {
  bench("small buffer (10 messages)", () => {
    const logger = new AsyncLogger({ bufferSize: 10 });

    for (let i = 0; i < 10; i++) {
      logger.info("Message", { i });
    }
  });

  bench("medium buffer (100 messages)", () => {
    const logger = new AsyncLogger({ bufferSize: 100 });

    for (let i = 0; i < 100; i++) {
      logger.info("Message", { i });
    }
  });

  bench("large buffer (1000 messages)", () => {
    const logger = new AsyncLogger({ bufferSize: 1000 });

    for (let i = 0; i < 1000; i++) {
      logger.info("Message", { i });
    }
  });
});

describe("Async: Memory Cleanup", () => {
  bench("create and destroy async logger", async () => {
    const logger = new AsyncLogger();
    logger.info("Test");
    await logger.destroy();
  });

  bench("create, use, flush, destroy", async () => {
    const logger = new AsyncLogger({ bufferSize: 10 });

    for (let i = 0; i < 10; i++) {
      logger.info("Message", { i });
    }

    await logger.forceFlush();
    await logger.destroy();
  });
});
