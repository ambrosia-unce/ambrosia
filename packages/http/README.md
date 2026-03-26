# @ambrosia/http

Provider-agnostic HTTP layer for the Ambrosia framework. Decorator-based controllers, a pre-compiled request pipeline, and full support for guards, interceptors, pipes, middleware, exception filters, SSE, and OpenAPI generation.

## Features

- **Provider-agnostic** -- swap between adapters by implementing the `HttpProvider` interface
- **Pre-compiled request pipeline** -- route handlers are compiled once at startup for minimal per-request overhead
- **Full lifecycle pipeline** -- Middleware, Guards, Interceptors, Pipes, Handler, Exception Filters
- **Decorator-driven routing** -- `@Controller`, `@Http.Get()`, `@Http.Post()`, `@Body()`, `@Param()`, and more
- **Built-in pipes** -- `ValidationPipe`, `ParseIntPipe`, `ParseBoolPipe`, `ParseFloatPipe`, `ParseUUIDPipe`, `ParseEnumPipe`, `DefaultValuePipe`
- **Built-in exceptions** -- `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, and others with standard HTTP status codes
- **Server-Sent Events** -- `@Sse()` decorator with `SseStream` helper
- **OpenAPI 3.0 generation** -- automatic spec generation from controller metadata and `@ApiProperty` / `@ApiResponse` / `@ApiTags` decorators
- **Custom metadata** -- `SetMetadata` / `@Public()` for role-based access control and similar patterns
- **Request scoping** -- `Scope.REQUEST` providers via `AsyncLocalStorage`
- **Testing utilities** -- `TestingHttpFactory` with `MockHttpProvider` for full pipeline testing without a real server
- **TypeScript first** -- full type safety across the entire API surface
- **Bun native** -- optimized for the Bun runtime

## Installation

```bash
bun add @ambrosia/http @ambrosia/core reflect-metadata
```

You will also need an HTTP provider adapter, for example:

```bash
bun add @ambrosia/http-elysia
```

## Quick Start

```typescript
import "reflect-metadata";
import { Injectable } from "@ambrosia/core";
import {
  HttpApplication,
  Controller,
  Http,
  Body,
  Param,
  Query,
  Status,
  type HttpPackDefinition,
} from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";

// Define a service
@Injectable()
class UserService {
  private users = [{ id: "1", name: "Alice" }];

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find((u) => u.id === id);
  }

  create(data: { name: string }) {
    const user = { id: String(this.users.length + 1), ...data };
    this.users.push(user);
    return user;
  }
}

// Define a controller
@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Http.Get("/")
  list(@Query("search") search?: string) {
    const users = this.userService.findAll();
    return search
      ? users.filter((u) => u.name.includes(search))
      : users;
  }

  @Http.Get("/:id")
  getOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Http.Post("/")
  @Status(201)
  create(@Body() body: { name: string }) {
    return this.userService.create(body);
  }
}

// Define a pack (module)
const UserPack: HttpPackDefinition = {
  name: "UserPack",
  controllers: [UserController],
  providers: [{ token: UserService, useClass: UserService }],
  exports: [UserService],
};

// Bootstrap the application
const app = await HttpApplication.create({
  provider: ElysiaProvider,
  packs: [UserPack],
  prefix: "/api",
});

await app.listen(3000);
```

## Key Concepts

### Controllers

Controllers handle incoming requests and return responses. The `@Controller()` decorator marks a class as a controller and automatically applies `@Injectable()`.

```typescript
@Controller("/products")
class ProductController {
  @Http.Get("/")
  list() {
    return [{ id: 1, name: "Widget" }];
  }

  @Http.Get("/:id")
  getOne(@Param("id") id: string) {
    return { id, name: "Widget" };
  }

  @Http.Post("/")
  @Status(201)
  create(@Body() body: any) {
    return { id: 2, ...body };
  }

  @Http.Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return { id, ...body };
  }

  @Http.Delete("/:id")
  @Status(204)
  remove(@Param("id") id: string) {}
}
```

#### Parameter Decorators

Extract data from the incoming request:

| Decorator | Description |
|---|---|
| `@Body()` | Parsed request body |
| `@Query(key?)` | Query string parameters (all or by key) |
| `@Param(key?)` | Route path parameters (all or by key) |
| `@Headers()` | All request headers |
| `@Header(name)` | Single request header by name |
| `@Req()` | Full request object (`IHttpRequest`) |
| `@Res()` | Full response object (`IHttpResponse`) |
| `@Ctx()` | Native provider context (e.g. Elysia `Context`) |
| `@Cookie(name?)` | Cookies (all or by name) |
| `@Ip()` | Client IP address |
| `@Session()` | Session data |
| `@UploadedFile(field)` | Single uploaded file by field name |
| `@UploadedFiles(field?)` | Array of uploaded files (all or by field) |

#### Response Decorators

| Decorator | Description |
|---|---|
| `@Status(code)` | Set HTTP status code |
| `@SetHeader(name, value)` | Set a response header |
| `@Redirect(url, status?)` | Redirect to a URL (default 302) |
| `@Timeout(ms)` | Set handler timeout; throws `RequestTimeoutException` on expiry |
| `@Sse()` | Mark endpoint as a Server-Sent Events stream |

### Request Pipeline

Every request flows through a pre-compiled pipeline:

```
Middleware --> Guards --> Interceptors --> [Param resolution + Pipes] --> Handler --> Filters
```

Pipeline components can be applied globally, at the controller level, or at individual method level.

### Guards

Guards determine whether a request should be handled. Return `true` to allow or `false` to deny (throws `ForbiddenException`).

```typescript
@Injectable()
class AuthGuard implements Guard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const http = context.switchToHttp();
    const token = http.getRequest().headers["authorization"];
    return !!token;
  }
}

@Controller("/admin")
@UseGuard(AuthGuard)
class AdminController {
  @Http.Get("/dashboard")
  dashboard() {
    return { message: "Welcome, admin" };
  }

  // Skip auth for this route using @Public()
  @Http.Get("/health")
  @Public()
  health() {
    return { ok: true };
  }
}
```

Guards can read custom metadata via `context.getMetadata(key)`. Use `SetMetadata` or the built-in `@Public()` decorator to attach metadata:

```typescript
const Roles = (...roles: string[]) => SetMetadata("roles", roles);

@Injectable()
class RoleGuard implements Guard {
  canActivate(context: ExecutionContext) {
    const requiredRoles = context.getMetadata("roles") as string[];
    if (!requiredRoles) return true;
    // ... check user roles
  }
}
```

### Interceptors

Interceptors wrap the handler execution and can transform the request, the response, or both.

```typescript
@Injectable()
class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const start = Date.now();
    const result = await next.handle();
    console.log(`Request took ${Date.now() - start}ms`);
    return result;
  }
}

@Injectable()
class WrapResponseInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const data = await next.handle();
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

@Controller("/posts")
@UseInterceptor(LoggingInterceptor)
class PostController {
  @Http.Get("/")
  @UseInterceptor(WrapResponseInterceptor)
  list() {
    return [{ id: 1, title: "Hello" }];
  }
}
```

### Pipes

Pipes validate and transform parameter values before they reach the handler.

```typescript
// Built-in pipes
@Controller("/items")
class ItemController {
  @Http.Get("/:id")
  @UsePipe(ParseIntPipe)
  getItem(@Param("id") id: number) {
    // id is already a number
  }
}

// Custom pipe
@Injectable()
class TrimStringPipe implements Pipe {
  transform(value: any): any {
    return typeof value === "string" ? value.trim() : value;
  }
}
```

Built-in pipes:

| Pipe | Description |
|---|---|
| `ValidationPipe` | Validates input data |
| `ParseIntPipe` | Converts string to integer |
| `ParseFloatPipe` | Converts string to float |
| `ParseBoolPipe` | Converts string to boolean |
| `ParseUUIDPipe` | Validates UUID format |
| `ParseEnumPipe` | Validates value is a member of an enum |
| `DefaultValuePipe` | Provides a default when value is `undefined` or `null` |

### Middleware

Middleware executes before guards in the pipeline. It supports both class-based and functional styles.

```typescript
// Class-based middleware
@Injectable()
class CorsMiddleware implements Middleware {
  async use(req: IHttpRequest, res: IHttpResponse, next: () => Promise<void>) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    await next();
  }
}

// Functional middleware
const logger: MiddlewareFunction = async (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  await next();
};

@Controller("/api")
@UseMiddleware(CorsMiddleware, logger)
class ApiController {
  @Http.Get("/ping")
  ping() {
    return "pong";
  }
}
```

Middleware can also be applied globally via `HttpApplicationOptions.globalMiddleware`.

### Exception Filters

Exception filters catch errors thrown during request processing and produce a structured error response. A default filter is registered automatically if none are specified.

```typescript
@Injectable()
class CustomExceptionFilter implements ExceptionFilter {
  catch({ exception, httpContext }: ExceptionFilterArgs) {
    const status = exception.status || 500;
    return {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: httpContext.request.path,
    };
  }
}

@Controller("/api")
@UseFilter(CustomExceptionFilter)
class ApiController {
  @Http.Get("/fail")
  fail() {
    throw new NotFoundException("Resource not found");
  }
}
```

Built-in exceptions:

| Exception | Status Code |
|---|---|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `MethodNotAllowedException` | 405 |
| `RequestTimeoutException` | 408 |
| `ConflictException` | 409 |
| `UnprocessableEntityException` | 422 |
| `InternalServerErrorException` | 500 |

### Server-Sent Events (SSE)

Mark a route with `@Sse()` and return an `SseStream` instance:

```typescript
@Controller("/events")
class EventsController {
  @Http.Get("/")
  @Sse()
  stream() {
    const sse = new SseStream();

    const interval = setInterval(() => {
      sse.send({ data: { time: Date.now() }, event: "tick" });
    }, 1000);

    sse.onClose(() => clearInterval(interval));

    return sse;
  }
}
```

### OpenAPI Generation

Generate an OpenAPI 3.0 specification from your controller metadata:

```typescript
import { OpenApiGenerator } from "@ambrosia/http";

const spec = OpenApiGenerator.generate({
  title: "My API",
  version: "1.0.0",
  description: "Auto-generated documentation",
  prefix: "/api",
});

@Controller("/docs")
class DocsController {
  @Http.Get("/openapi.json")
  getSpec() {
    return spec;
  }
}
```

Use `@ApiProperty`, `@ApiResponse`, and `@ApiTags` decorators on your DTOs and controllers for richer specs.

### HttpPackDefinition

`HttpPackDefinition` extends the core `PackDefinition` with a `controllers` array. Use it to organize your application into feature modules:

```typescript
const OrderPack: HttpPackDefinition = {
  name: "OrderPack",
  controllers: [OrderController],
  providers: [
    { token: OrderService, useClass: OrderService },
    { token: OrderRepository, useClass: OrderRepository },
  ],
  exports: [OrderService],
  imports: [UserPack],
};
```

### HttpApplication Options

```typescript
const app = await HttpApplication.create({
  provider: ElysiaProvider,        // HTTP provider class (required)
  packs: [UserPack, OrderPack],    // Feature packs
  controllers: [HealthController], // Additional standalone controllers
  prefix: "/api",                  // Global route prefix
  port: 3000,                      // Default listen port
  globalMiddleware: [CorsMiddleware],
  globalGuards: [AuthGuard],
  globalInterceptors: [LoggingInterceptor],
  globalPipes: [ValidationPipe],
  globalFilters: [CustomExceptionFilter],
  excludeControllers: [DebugController], // Exclude specific controllers
});

await app.listen();   // Uses port from options, or 3000 by default
await app.close();    // Graceful shutdown with pack onDestroy hooks
```

## Testing

`TestingHttpFactory` creates an application backed by a `MockHttpProvider` so you can exercise the full request pipeline without starting a server:

```typescript
import { TestingHttpFactory } from "@ambrosia/http";

const module = await TestingHttpFactory
  .create({
    packs: [UserPack],
    controllers: [HealthController],
  })
  .overrideValue(DB_TOKEN, mockDatabase)
  .compile();

// Simulate a GET request
const res = await module.inject({ method: "GET", url: "/users/1" });
expect(res.statusCode).toBe(200);
expect(res.body.name).toBe("Alice");

// Simulate a POST request
const created = await module.inject({
  method: "POST",
  url: "/users",
  body: { name: "Bob" },
  headers: { "content-type": "application/json" },
});
expect(created.statusCode).toBe(201);

// Retrieve a service from the container
const userService = module.get(UserService);

// Clean up
await module.close();
```

## Requirements

- TypeScript >= 5.0
- Bun >= 1.3.6
- `@ambrosia/core` as a peer
- `experimentalDecorators: true` in tsconfig.json
- `emitDecoratorMetadata: true` in tsconfig.json
- `reflect-metadata` imported at the application entry point

## License

MIT
