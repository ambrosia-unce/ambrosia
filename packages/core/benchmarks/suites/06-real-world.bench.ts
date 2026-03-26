/**
 * Real-World Scenario Benchmarks
 *
 * Simulates realistic application patterns:
 * - Application startup
 * - Request handling
 * - Microservice patterns
 * - CLI tools
 */

import { Container, Injectable, Scope } from "../../src/index.ts";
import { bench, describe } from "../utils/bench.ts";

// ==================== Simulated Services ====================

// Configuration layer
@Injectable()
class ConfigService {
  get(key: string): string {
    return `config_${key}`;
  }
}

// Data layer
@Injectable()
class DatabaseService {
  constructor(private config: ConfigService) {}

  query(sql: string): any[] {
    return [{ id: 1, data: sql }];
  }
}

@Injectable()
class CacheService {
  private cache = new Map<string, any>();

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
}

// Repository layer
@Injectable()
class UserRepository {
  constructor(
    private db: DatabaseService,
    private cache: CacheService,
  ) {}

  findById(id: number): any {
    const cached = this.cache.get(`user_${id}`);
    if (cached) return cached;

    const result = this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    this.cache.set(`user_${id}`, result[0]);
    return result[0];
  }
}

@Injectable()
class ProductRepository {
  constructor(
    private db: DatabaseService,
    private cache: CacheService,
  ) {}

  findAll(): any[] {
    return this.db.query("SELECT * FROM products");
  }
}

// Service layer
@Injectable()
class UserService {
  constructor(private userRepo: UserRepository) {}

  getUser(id: number): any {
    return this.userRepo.findById(id);
  }
}

@Injectable()
class ProductService {
  constructor(private productRepo: ProductRepository) {}

  listProducts(): any[] {
    return this.productRepo.findAll();
  }
}

@Injectable()
class AuthService {
  constructor(
    private config: ConfigService,
    private userService: UserService,
  ) {}

  authenticate(username: string, password: string): boolean {
    const user = this.userService.getUser(1);
    return user !== null;
  }
}

// Controller layer (request-scoped)
@Injectable()
class RequestContext {
  requestId = Math.random().toString(36);
  startTime = Date.now();
}

@Injectable()
class UserController {
  constructor(
    private userService: UserService,
    private auth: AuthService,
    private context: RequestContext,
  ) {}

  getUser(id: number): any {
    // Simulate request handling
    return this.userService.getUser(id);
  }
}

@Injectable()
class ProductController {
  constructor(
    private productService: ProductService,
    private context: RequestContext,
  ) {}

  listProducts(): any[] {
    return this.productService.listProducts();
  }
}

// ==================== Benchmarks ====================

describe("Real-World: Application Startup", () => {
  bench("cold start - create container", () => {
    new Container({ mode: "production" });
  });

  bench("resolve configuration layer", () => {
    const container = new Container({ mode: "production" });
    container.resolve(ConfigService);
  });

  bench("resolve data layer (config + db + cache)", () => {
    const container = new Container({ mode: "production" });
    container.resolve(DatabaseService);
    container.resolve(CacheService);
  });

  bench("resolve repository layer", () => {
    const container = new Container({ mode: "production" });
    container.resolve(UserRepository);
    container.resolve(ProductRepository);
  });

  bench("resolve service layer", () => {
    const container = new Container({ mode: "production" });
    container.resolve(UserService);
    container.resolve(ProductService);
    container.resolve(AuthService);
  });

  bench("full application bootstrap", () => {
    const container = new Container({ mode: "production" });

    // Resolve all core services
    container.resolve(ConfigService);
    container.resolve(DatabaseService);
    container.resolve(CacheService);
    container.resolve(UserRepository);
    container.resolve(ProductRepository);
    container.resolve(UserService);
    container.resolve(ProductService);
    container.resolve(AuthService);
  });
});

describe("Real-World: HTTP Request Handling", () => {
  bench("single request (user endpoint)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    container.requestStorage.run(() => {
      const controller = container.resolve(UserController);
      controller.getUser(1);
    });
  });

  bench("single request (product endpoint)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    container.requestStorage.run(() => {
      const controller = container.resolve(ProductController);
      controller.listProducts();
    });
  });

  bench("10 sequential requests", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        const controller = container.resolve(UserController);
        controller.getUser(i);
      });
    }
  });

  bench("request with authentication", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    container.requestStorage.run(() => {
      const auth = container.resolve(AuthService);
      auth.authenticate("user", "pass");

      const controller = container.resolve(UserController);
      controller.getUser(1);
    });
  });
});

describe("Real-World: Microservice Pattern", () => {
  bench("microservice instance creation", () => {
    const container = new Container({ mode: "production" });

    // Typical microservice dependencies
    container.resolve(ConfigService);
    container.resolve(DatabaseService);
    container.resolve(CacheService);
    container.resolve(UserService);
  });

  bench("handle 100 requests (microservice)", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    // Pre-warm services (startup)
    container.resolve(UserService);

    // Handle requests
    for (let i = 0; i < 100; i++) {
      container.requestStorage.run(() => {
        const controller = container.resolve(UserController);
        controller.getUser(i % 10);
      });
    }
  });

  bench("multi-tenant request (different containers)", () => {
    // Simulate multi-tenant where each tenant has its own container
    const tenant1 = new Container({ mode: "production" });
    const tenant2 = new Container({ mode: "production" });
    const tenant3 = new Container({ mode: "production" });

    tenant1.resolve(UserService);
    tenant2.resolve(UserService);
    tenant3.resolve(UserService);
  });
});

describe("Real-World: CLI Tool Pattern", () => {
  bench("CLI startup and single command", () => {
    const container = new Container({ mode: "production" });

    // Load config
    const config = container.resolve(ConfigService);

    // Execute command (resolve needed services)
    const userService = container.resolve(UserService);
    userService.getUser(1);
  });

  bench("CLI with multiple commands", () => {
    const container = new Container({ mode: "production" });

    // Command 1: user info
    container.resolve(UserService).getUser(1);

    // Command 2: list products
    container.resolve(ProductService).listProducts();

    // Command 3: auth check
    container.resolve(AuthService).authenticate("user", "pass");
  });

  bench("CLI batch processing (100 items)", () => {
    const container = new Container({ mode: "production" });
    const userService = container.resolve(UserService);

    for (let i = 0; i < 100; i++) {
      userService.getUser(i);
    }
  });
});

describe("Real-World: Background Worker", () => {
  bench("worker startup and task processing", () => {
    const container = new Container({ mode: "production" });

    // Initialize worker services
    const db = container.resolve(DatabaseService);
    const cache = container.resolve(CacheService);

    // Process task
    const userRepo = container.resolve(UserRepository);
    userRepo.findById(1);
  });

  bench("process 50 background tasks", () => {
    const container = new Container({ mode: "production" });
    const userRepo = container.resolve(UserRepository);

    for (let i = 0; i < 50; i++) {
      userRepo.findById(i);
    }
  });
});

describe("Real-World: Development vs Production", () => {
  bench("development mode: full app bootstrap", () => {
    const container = new Container({ mode: "development" });

    container.resolve(ConfigService);
    container.resolve(DatabaseService);
    container.resolve(CacheService);
    container.resolve(UserService);
    container.resolve(ProductService);
    container.resolve(AuthService);
  });

  bench("production mode: full app bootstrap", () => {
    const container = new Container({ mode: "production" });

    container.resolve(ConfigService);
    container.resolve(DatabaseService);
    container.resolve(CacheService);
    container.resolve(UserService);
    container.resolve(ProductService);
    container.resolve(AuthService);
  });

  bench("development mode: 10 requests", () => {
    const container = new Container({ mode: "development" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        container.resolve(UserController).getUser(i);
      });
    }
  });

  bench("production mode: 10 requests", () => {
    const container = new Container({ mode: "production" });
    container.registerClass(RequestContext, RequestContext, Scope.REQUEST);

    for (let i = 0; i < 10; i++) {
      container.requestStorage.run(() => {
        container.resolve(UserController).getUser(i);
      });
    }
  });
});
