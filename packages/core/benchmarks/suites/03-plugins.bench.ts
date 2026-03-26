/**
 * Plugin System Performance Benchmarks
 *
 * Tests overhead of plugin system:
 * - No plugins vs with plugins
 * - Single plugin vs multiple plugins
 * - Sync vs async plugin manager
 */

import { Container, Injectable } from "../../src/index.ts";
import { LoggingPlugin } from "../../src/plugins/logging-plugin.ts";
import type { Plugin } from "../../src/plugins/types.ts";
import { SilentLogger } from "../../src/utils/logger.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Test Classes ====================

@Injectable()
class SimpleService {
  getValue(): string {
    return "test";
  }
}

@Injectable()
class ComplexService {
  constructor(private simple: SimpleService) {}

  compute(): string {
    return this.simple.getValue();
  }
}

// ==================== Test Plugins ====================

class NoopPlugin implements Plugin {
  name = "noop";

  onBeforeResolve() {
    // Minimal overhead
  }

  onAfterResolve() {
    // Minimal overhead
  }
}

class HeavyPlugin implements Plugin {
  name = "heavy";
  private counter = 0;
  private data: number[] = [];

  onBeforeResolve() {
    this.counter++;
    this.data.push(performance.now());
  }

  onAfterResolve() {
    this.counter++;
    if (this.data.length > 1000) {
      this.data = this.data.slice(-100);
    }
  }
}

// ==================== Benchmarks ====================

describe("Plugin: Overhead Baseline", () => {
  bench("no plugins - simple resolve", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SimpleService);
  });

  bench("no plugins - complex resolve", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ComplexService);
  });

  bench("no plugins - 10 resolutions", () => {
    const container = new Container({ mode: "production" });
    for (let i = 0; i < 10; i++) {
      container.resolve(SimpleService);
    }
  });
});

describe("Plugin: Single Plugin", () => {
  bench("noop plugin - simple resolve", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.resolve(SimpleService);
  });

  bench("noop plugin - complex resolve", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.resolve(ComplexService);
  });

  bench("logging plugin - simple resolve", () => {
    const container = new Container({ mode: "production" });
    container.use(new LoggingPlugin({ logger: new SilentLogger() }));
    container.resolve(SimpleService);
  });

  bench("heavy plugin - simple resolve", () => {
    const container = new Container({ mode: "production" });
    container.use(new HeavyPlugin());
    container.resolve(SimpleService);
  });
});

describe("Plugin: Multiple Plugins", () => {
  bench("2 noop plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.resolve(SimpleService);
  });

  bench("3 noop plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.resolve(SimpleService);
  });

  bench("5 noop plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.resolve(SimpleService);
  });

  bench("mixed plugins (noop + logging + heavy)", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new LoggingPlugin({ logger: new SilentLogger() }));
    container.use(new HeavyPlugin());
    container.resolve(ComplexService);
  });
});

describe("Plugin: Repeated Resolutions", () => {
  bench("10 resolutions with 1 plugin", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());

    for (let i = 0; i < 10; i++) {
      container.resolve(SimpleService);
    }
  });

  bench("10 resolutions with 3 plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());

    for (let i = 0; i < 10; i++) {
      container.resolve(SimpleService);
    }
  });

  bench("100 resolutions with heavy plugin", () => {
    const container = new Container({ mode: "production" });
    container.use(new HeavyPlugin());

    for (let i = 0; i < 100; i++) {
      container.resolve(SimpleService);
    }
  });
});

describe("Plugin: Container Creation Overhead", () => {
  bench("create container without plugins", () => {
    new Container({ mode: "production" });
  });

  bench("create container with 1 plugin", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
  });

  bench("create container with 3 plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
  });

  bench("create container with 5 plugins", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
    container.use(new NoopPlugin());
  });
});

describe("Plugin: Plugin Manager Operations", () => {
  bench("register plugin", () => {
    const container = new Container({ mode: "production" });
    container.use(new NoopPlugin());
  });

  bench("register 10 plugins sequentially", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.use(new NoopPlugin());
    }
  });
});
