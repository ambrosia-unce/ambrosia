/**
 * DI Container Performance Benchmarks
 *
 * Measures performance improvements from optimizations:
 * - Provider lookup (flattened cache)
 * - Scope manager (fast path)
 * - Metadata caching
 * - Production mode
 */

import { Autowired, Container, Inject, Injectable, Scope } from "../../src/index.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Test Classes ====================

@Injectable()
class SimpleService {
  getValue(): string {
    return "simple";
  }
}

@Injectable()
class ServiceWithDependency {
  constructor(private simple: SimpleService) {}

  getValue(): string {
    return this.simple.getValue();
  }
}

@Injectable()
class ComplexService {
  constructor(
    private simple: SimpleService,
    private withDep: ServiceWithDependency,
  ) {}

  getValue(): string {
    return `${this.simple.getValue()}-${this.withDep.getValue()}`;
  }
}

@Injectable()
class ServiceWithPropertyInjection {
  @Autowired()
  simple!: SimpleService;

  getValue(): string {
    return this.simple.getValue();
  }
}

// Services with multiple dependencies
@Injectable()
class Service1 {
  value = 1;
}

@Injectable()
class Service2 {
  value = 2;
}

@Injectable()
class Service3 {
  value = 3;
}

@Injectable()
class Service4 {
  value = 4;
}

@Injectable()
class Service5 {
  value = 5;
}

@Injectable()
class MegaService {
  constructor(
    private s1: Service1,
    private s2: Service2,
    private s3: Service3,
    private s4: Service4,
    private s5: Service5,
  ) {}

  getTotal(): number {
    return this.s1.value + this.s2.value + this.s3.value + this.s4.value + this.s5.value;
  }
}

// ==================== Benchmarks ====================

describe("Provider Lookup Performance", () => {
  bench("resolve simple service (development mode)", () => {
    const container = new Container({ mode: "development" });
    container.resolve(SimpleService);
  });

  bench("resolve simple service (production mode)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SimpleService);
  });

  bench("resolve with dependency (development)", () => {
    const container = new Container({ mode: "development" });
    container.resolve(ServiceWithDependency);
  });

  bench("resolve with dependency (production)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ServiceWithDependency);
  });
});

describe("Singleton Cache Performance", () => {
  bench("cold resolution (first time)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ComplexService);
  });

  bench("warm resolution (cached singleton)", () => {
    const container = new Container({ mode: "production" });
    // Pre-warm cache
    container.resolve(ComplexService);

    // Measure cached access
    container.resolve(ComplexService);
  });

  bench("100 cached resolutions", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ComplexService);

    for (let i = 0; i < 100; i++) {
      container.resolve(ComplexService);
    }
  });
});

describe("Metadata Caching Performance", () => {
  bench("resolve service with property injection", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ServiceWithPropertyInjection);
  });

  bench("resolve service with 5 dependencies", () => {
    const container = new Container({ mode: "production" });
    container.resolve(MegaService);
  });

  bench("repeated resolution (metadata cache hit)", () => {
    const container = new Container({ mode: "production" });

    // First resolution
    container.resolve(MegaService);

    // Measure second resolution with metadata cached
    const container2 = new Container({ mode: "production" });
    container2.resolve(MegaService);
  });
});

describe("Scope Manager Performance", () => {
  bench("singleton scope check", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SimpleService);
  });

  bench("transient scope (no caching)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(SimpleService, SimpleService, Scope.TRANSIENT);
    container.resolve(SimpleService);
  });

  bench("request scope within context", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(SimpleService, SimpleService, Scope.REQUEST);

    container.requestStorage.run(() => {
      container.resolve(SimpleService);
    });
  });
});

describe("Production Mode vs Development Mode", () => {
  bench("development mode: simple service", () => {
    const container = new Container({ mode: "development" });
    container.resolve(SimpleService);
  });

  bench("production mode: simple service", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SimpleService);
  });

  bench("development mode: complex service", () => {
    const container = new Container({ mode: "development" });
    container.resolve(ComplexService);
  });

  bench("production mode: complex service", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ComplexService);
  });

  bench("development mode: mega service (5 deps)", () => {
    const container = new Container({ mode: "development" });
    container.resolve(MegaService);
  });

  bench("production mode: mega service (5 deps)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(MegaService);
  });
});

describe("Container Creation Performance", () => {
  bench("create development container", () => {
    new Container({ mode: "development" });
  });

  bench("create production container", () => {
    new Container({ mode: "production" });
  });

  bench("create container with auto-registration", () => {
    new Container({ mode: "production", autoRegister: true });
  });

  bench("create container without auto-registration", () => {
    new Container({ mode: "production", autoRegister: false });
  });
});

describe("Real-World Scenario", () => {
  bench("typical app startup (10 services)", () => {
    const container = new Container({ mode: "production" });

    // Resolve typical set of services
    container.resolve(SimpleService);
    container.resolve(ServiceWithDependency);
    container.resolve(ComplexService);
    container.resolve(ServiceWithPropertyInjection);
    container.resolve(MegaService);
    container.resolve(Service1);
    container.resolve(Service2);
    container.resolve(Service3);
    container.resolve(Service4);
    container.resolve(Service5);
  });

  bench("request handling simulation (cached services)", () => {
    const container = new Container({ mode: "production" });

    // Pre-warm
    container.resolve(ComplexService);

    // Simulate 10 requests
    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        container.resolve(ComplexService);
      });
    }
  });
});
