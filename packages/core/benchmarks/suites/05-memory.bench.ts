/**
 * Memory Usage Benchmarks
 *
 * Tests memory footprint and GC behavior:
 * - Memory per resolution
 * - Cache memory usage
 * - Memory leaks detection
 * - GC pressure
 */

import { Container, Injectable, Scope } from "../../src/index.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Test Classes ====================

@Injectable()
class TinyService {
  value = 1;
}

@Injectable()
class MediumService {
  data = new Array(100).fill(0);

  process(): number {
    return this.data.reduce((a, b) => a + b, 0);
  }
}

@Injectable()
class LargeService {
  data = new Array(10000).fill(Math.random());

  process(): number {
    return this.data.reduce((a, b) => a + b, 0);
  }
}

@Injectable()
class ServiceWithDeps {
  constructor(
    private tiny: TinyService,
    private medium: MediumService,
  ) {}

  compute(): number {
    return this.tiny.value + this.medium.process();
  }
}

// ==================== Benchmarks ====================

describe("Memory: Container Creation", () => {
  bench("create empty container", () => {
    new Container({ mode: "production" });
  });

  bench("create container and resolve 1 service", () => {
    const container = new Container({ mode: "production" });
    container.resolve(TinyService);
  });

  bench("create container and resolve 10 services", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.resolve(TinyService);
    }
  });
});

describe("Memory: Service Size Impact", () => {
  bench("resolve tiny service (minimal memory)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(TinyService);
  });

  bench("resolve medium service (~100 items)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(MediumService);
  });

  bench("resolve large service (~10k items)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(LargeService);
  });
});

describe("Memory: Singleton Cache", () => {
  bench("cache 10 tiny singletons", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.resolve(TinyService);
    }
  });

  bench("cache 10 medium singletons", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.resolve(MediumService);
    }
  });

  bench("cache 100 tiny singletons", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 100; i++) {
      container.resolve(TinyService);
    }
  });
});

describe("Memory: Transient Instances", () => {
  bench("create 10 transient tiny services", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TinyService, TinyService, Scope.TRANSIENT);

    for (let i = 0; i < 10; i++) {
      container.resolve(TinyService);
    }
  });

  bench("create 10 transient medium services", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(MediumService, MediumService, Scope.TRANSIENT);

    for (let i = 0; i < 10; i++) {
      container.resolve(MediumService);
    }
  });

  bench("create 100 transient tiny services", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TinyService, TinyService, Scope.TRANSIENT);

    for (let i = 0; i < 100; i++) {
      container.resolve(TinyService);
    }
  });
});

describe("Memory: Cache Clearing", () => {
  bench("clear empty singleton cache", () => {
    const container = new Container({ mode: "production" });
    container.clearScope(Scope.SINGLETON);
  });

  bench("clear cache with 10 singletons", () => {
    const container = new Container({ mode: "production" });

    // Populate cache
    for (let i = 0; i < 10; i++) {
      container.resolve(TinyService);
    }

    // Clear
    container.clearScope(Scope.SINGLETON);
  });

  bench("clear cache with 100 singletons", () => {
    const container = new Container({ mode: "production" });

    // Populate cache
    for (let i = 0; i < 100; i++) {
      container.resolve(TinyService);
    }

    // Clear
    container.clearScope(Scope.SINGLETON);
  });

  bench("populate, clear, resolve again", () => {
    const container = new Container({ mode: "production" });

    // First resolution
    container.resolve(MediumService);

    // Clear
    container.clearScope(Scope.SINGLETON);

    // Re-resolve
    container.resolve(MediumService);
  });
});

describe("Memory: GC Behavior", () => {
  bench("force GC (if available)", () => {
    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    }
  });

  bench("resolve 100 services + force GC", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 100; i++) {
      container.resolve(TinyService);
    }

    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    }
  });

  bench("transient 100x + GC", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(MediumService, MediumService, Scope.TRANSIENT);

    for (let i = 0; i < 100; i++) {
      container.resolve(MediumService);
    }

    if (typeof Bun !== "undefined" && Bun.gc) {
      Bun.gc(true);
    }
  });
});

describe("Memory: Container Lifecycle", () => {
  bench("create 10 containers sequentially", () => {
    for (let i = 0; i < 10; i++) {
      const container = new Container({ mode: "production" });
      container.resolve(TinyService);
    }
  });

  bench("create, use, clear 10 containers", () => {
    for (let i = 0; i < 10; i++) {
      const container = new Container({ mode: "production" });
      container.resolve(MediumService);
      container.clearScope(Scope.SINGLETON);
    }
  });
});

describe("Memory: Dependency Graph", () => {
  bench("resolve with dependencies (tiny)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ServiceWithDeps);
  });

  bench("resolve with dependencies 10x", () => {
    const container = new Container({ mode: "production" });

    for (let i = 0; i < 10; i++) {
      container.resolve(ServiceWithDeps);
    }
  });
});

describe("Memory: Request Scope", () => {
  bench("10 request contexts with service", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(MediumService, MediumService, Scope.REQUEST);

    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        container.resolve(MediumService);
      });
    }
  });

  bench("nested request contexts", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TinyService, TinyService, Scope.REQUEST);

    container.requestStorage.run(() => {
      container.resolve(TinyService);

      container.requestStorage.run(() => {
        container.resolve(TinyService);

        container.requestStorage.run(() => {
          container.resolve(TinyService);
        });
      });
    });
  });
});
