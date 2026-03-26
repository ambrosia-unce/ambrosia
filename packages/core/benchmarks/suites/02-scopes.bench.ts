/**
 * Scope Manager Performance Benchmarks
 *
 * Tests performance of different scopes:
 * - SINGLETON (cached)
 * - TRANSIENT (no cache)
 * - REQUEST (async local storage)
 */

import { Container, Injectable, Scope } from "../../src/index.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Test Classes ====================

@Injectable()
class SingletonService {
  private value = Math.random();

  getValue(): number {
    return this.value;
  }
}

@Injectable()
class TransientService {
  private value = Math.random();

  getValue(): number {
    return this.value;
  }
}

@Injectable()
class RequestScopedService {
  private value = Math.random();

  getValue(): number {
    return this.value;
  }
}

@Injectable()
class ServiceWithDependencies {
  constructor(
    private singleton: SingletonService,
    private transient: TransientService,
  ) {}

  compute(): number {
    return this.singleton.getValue() + this.transient.getValue();
  }
}

// ==================== Benchmarks ====================

describe("Scope: SINGLETON", () => {
  bench("resolve singleton (first time - cold)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SingletonService);
  });

  bench("resolve singleton (cached - warm)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SingletonService); // Pre-warm

    container.resolve(SingletonService); // Measure
  });

  bench("resolve singleton 100x (all cached)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SingletonService); // Pre-warm

    for (let i = 0; i < 100; i++) {
      container.resolve(SingletonService);
    }
  });

  bench("multiple singletons (5 different)", () => {
    @Injectable()
    class Service1 {}
    @Injectable()
    class Service2 {}
    @Injectable()
    class Service3 {}
    @Injectable()
    class Service4 {}
    @Injectable()
    class Service5 {}

    const container = new Container({ mode: "production" });

    container.resolve(Service1);
    container.resolve(Service2);
    container.resolve(Service3);
    container.resolve(Service4);
    container.resolve(Service5);
  });
});

describe("Scope: TRANSIENT", () => {
  bench("resolve transient (no caching)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

    container.resolve(TransientService);
  });

  bench("resolve transient 10x (new instance each)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

    for (let i = 0; i < 10; i++) {
      container.resolve(TransientService);
    }
  });

  bench("transient vs singleton comparison", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

    // Both resolve
    container.resolve(SingletonService);
    container.resolve(TransientService);
  });
});

describe("Scope: REQUEST", () => {
  bench("resolve in request scope", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestScopedService, RequestScopedService, Scope.REQUEST);

    container.requestStorage.run(() => {
      container.resolve(RequestScopedService);
    });
  });

  bench("resolve request scoped 10x in same context", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestScopedService, RequestScopedService, Scope.REQUEST);

    container.requestStorage.run(() => {
      for (let i = 0; i < 10; i++) {
        container.resolve(RequestScopedService);
      }
    });
  });

  bench("10 parallel request contexts", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestScopedService, RequestScopedService, Scope.REQUEST);

    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        container.resolve(RequestScopedService);
      });
    }
  });
});

describe("Scope: Mixed Dependencies", () => {
  bench("service with mixed scope dependencies", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

    container.resolve(ServiceWithDependencies);
  });

  bench("mixed scopes 10x resolution", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(TransientService, TransientService, Scope.TRANSIENT);

    for (let i = 0; i < 10; i++) {
      container.resolve(ServiceWithDependencies);
    }
  });
});

describe("Scope: Cache Operations", () => {
  bench("clear singleton cache (empty)", () => {
    const container = new Container({ mode: "production" });
    container.clearScope(Scope.SINGLETON);
  });

  bench("clear singleton cache (10 instances)", () => {
    @Injectable()
    class S1 {}
    @Injectable()
    class S2 {}
    @Injectable()
    class S3 {}
    @Injectable()
    class S4 {}
    @Injectable()
    class S5 {}
    @Injectable()
    class S6 {}
    @Injectable()
    class S7 {}
    @Injectable()
    class S8 {}
    @Injectable()
    class S9 {}
    @Injectable()
    class S10 {}

    const container = new Container({ mode: "production" });

    // Pre-populate cache
    container.resolve(S1);
    container.resolve(S2);
    container.resolve(S3);
    container.resolve(S4);
    container.resolve(S5);
    container.resolve(S6);
    container.resolve(S7);
    container.resolve(S8);
    container.resolve(S9);
    container.resolve(S10);

    // Measure clear
    container.clearScope(Scope.SINGLETON);
  });

  bench("resolve after cache clear", () => {
    const container = new Container({ mode: "production" });
    container.resolve(SingletonService); // Cache it
    container.clearScope(Scope.SINGLETON); // Clear

    container.resolve(SingletonService); // Measure re-resolve
  });
});
