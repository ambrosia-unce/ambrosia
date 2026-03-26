# @ambrosia/core

A powerful and flexible Dependency Injection container for TypeScript applications, built for the Bun runtime.

## Features

- **Constructor Injection** -- automatic dependency resolution via constructor parameters
- **Property Injection** -- inject dependencies into class properties with `@Autowired()`
- **InjectionToken** -- type-safe tokens for interfaces and configuration objects
- **Multiple Scopes** -- Singleton, Transient, and Request (via AsyncLocalStorage)
- **Factory Providers** -- flexible dependency creation with factory functions
- **Auto-resolve Circular Dependencies** -- automatic resolution using lazy proxies with console warnings
- **Pack System** -- a module composition unit with providers, exports, imports, and lifecycle hooks
- **Plugin System** -- hook into container lifecycle events (resolve, init, register) without modifying the core
- **TypeScript First** -- full type safety throughout the API
- **Bun Native** -- optimized for the Bun runtime

## Installation

```bash
bun add @ambrosia/core reflect-metadata
```

## Quick Start

```typescript
import "reflect-metadata";
import { Container, Injectable } from "@ambrosia/core";

@Injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@Injectable()
class UserService {
  constructor(private logger: Logger) {}

  getUser(id: number) {
    this.logger.log(`Getting user ${id}`);
    return { id, name: "John" };
  }
}

const container = new Container();
const userService = container.resolve(UserService);
userService.getUser(123);
```

## Key Concepts

### Constructor Injection

Dependencies are automatically resolved through constructor parameters:

```typescript
@Injectable()
class Database {
  connect() { /* ... */ }
}

@Injectable()
class UserService {
  constructor(private db: Database) {}
  // Database is automatically injected!
}
```

### Property Injection

Inject dependencies into class properties using `@Autowired()`:

```typescript
@Injectable()
class UserController {
  @Autowired()
  private logger!: Logger;

  @Autowired()
  @Optional()
  private cache?: CacheService;
}
```

### InjectionToken

Type-safe tokens for interfaces and configuration objects:

```typescript
interface AppConfig {
  port: number;
}

const CONFIG = new InjectionToken<AppConfig>("AppConfig");

container.registerValue(CONFIG, { port: 3000 });

@Injectable()
class ApiServer {
  constructor(@Inject(CONFIG) private config: AppConfig) {}
}
```

### Scopes

Control the lifecycle of your dependencies:

```typescript
// Singleton (default) -- one instance for the entire application
@Injectable({ scope: Scope.SINGLETON })
class Database {}

// Transient -- a new instance on every resolve call
@Injectable({ scope: Scope.TRANSIENT })
class RequestHandler {}

// Request -- one instance per HTTP request (via AsyncLocalStorage)
@Injectable({ scope: Scope.REQUEST })
class RequestContext {}
```

### Factory Providers

Use factory functions for custom dependency creation logic:

```typescript
container.registerFactory(
  CacheService,
  (c) => {
    const cache = new CacheService();
    cache.initialize();
    return cache;
  },
  Scope.SINGLETON
);
```

### Pack System

Packs are the unit of composition in Ambrosia. A `PackDefinition` declares providers, exports (for encapsulation), imports, and lifecycle hooks:

```typescript
import { definePack } from "@ambrosia/core";

const LoggingPack = definePack({
  meta: { name: "logging", version: "1.0.0" },
  providers: [LoggingService],
  exports: [LoggingService],
});

const AppPack = definePack({
  meta: { name: "app" },
  imports: [LoggingPack],
  providers: [UserService, OrderService],
  exports: [UserService],
  async onInit(container) {
    const logger = container.resolve(LoggingService);
    logger.log("App pack initialized");
  },
  async onDestroy() {
    // Graceful cleanup on shutdown
  },
});
```

Packs support conditional and lazy imports for advanced scenarios:

```typescript
const AppPack = definePack({
  imports: [
    CorePack,
    process.env.CACHE_ENABLED && CachePack, // conditional import
  ],
  lazyImports: () => [FeaturePack], // lazy import to break circular pack dependencies
});
```

### Auto-resolve Circular Dependencies

Enable automatic resolution of circular dependencies using lazy proxies:

```typescript
const container = new Container({ autoResolveCircular: true });

// Circular dependencies are now resolved automatically
// with a warning instead of an error
```

When a circular dependency is detected, the container:

- Logs a warning to the console
- Creates a lazy proxy for the circular dependency
- Allows the application to continue running

## API

### Container

```typescript
// Create a container
const container = new Container();
const containerWithAutoResolve = new Container({ autoResolveCircular: true });

// Register providers
container.register(UserService);
container.registerClass(AbstractService, ConcreteService);
container.registerValue(CONFIG, { port: 3000 });
container.registerFactory(Cache, (c) => new Cache());

// Resolve dependencies
const service = container.resolve(UserService);
const optional = container.resolveOptional(OptionalService);

// Async resolution
const asyncService = await container.resolveAsync(AsyncService);
```

### Decorators

```typescript
@Injectable({ scope: Scope.SINGLETON })  // Mark a class as injectable
@Inject(token)                           // Specify a token for a constructor parameter
@Autowired()                             // Inject into a property
@Optional()                              // Mark a dependency as optional
@Implements(AbstractClass)               // Bind an abstract class to its concrete implementation
```

## Requirements

- TypeScript >= 5.0
- Bun >= 1.3.6 (or Node.js >= 18 with an appropriate bundler)
- `experimentalDecorators: true` in tsconfig.json
- `emitDecoratorMetadata: true` in tsconfig.json

## License

MIT
