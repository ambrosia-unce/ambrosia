<div align="center">

# ambrosia

**The Bun Framework for Modern Backends**

Decorator-based DI, provider-agnostic HTTP, compile-time validation, and a pack ecosystem.
Built from the ground up for Bun.

[![npm](https://img.shields.io/npm/v/@ambrosia-unce/core?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ambrosia-unce/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-%23f9f1e1?logo=bun)](https://bun.sh)
[![CI](https://github.com/ambrosia-unce/ambrosia/actions/workflows/ci.yml/badge.svg)](https://github.com/ambrosia-unce/ambrosia/actions/workflows/ci.yml)

[Documentation](https://ambrosia.dev) · [Pack Market](https://packs.ambrosia.dev) · [GitHub](https://github.com/ambrosia-unce/ambrosia)

</div>

## Quick Start

```bash
bun add -g @ambrosia-unce/cli
ambrosia new my-app
cd my-app && bun run dev
```

## Features

**Dependency Injection** -- Token-based DI with constructor/property injection, 3 scopes, and a pack module system.

```typescript
@Injectable()
class UserService {
  constructor(private db: DatabaseService) {}
}
```

**Provider-Agnostic HTTP** -- Decorator-based controllers with a pre-compiled request pipeline: Middleware > Guards > Interceptors > Pipes > Handler > Filters.

```typescript
@Controller("/users")
class UserController {
  constructor(private users: UserService) {}

  @Http.Get("/:id")
  getOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }
}
```

**Compile-Time Validation** -- TypeScript types become runtime validators at build time. Zero overhead, no schemas.

```typescript
import { assert, type Email } from "@ambrosia-unce/validator";

interface CreateUser { name: string; email: Email }
const user = assert<CreateUser>(body); // validated + typed
```

**Type-Safe Config** -- Environment configuration with schema validation, injected through DI.

**Event Bus** -- Decorator-driven event system integrated with the DI container.

**CLI** -- Scaffold projects, generate resources, manage packs.

```bash
ambrosia new my-app
ambrosia g controller users
ambrosia add @ambrosia-unce/auth
```

**Pack Ecosystem** -- Installable feature modules via the pack marketplace.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@ambrosia-unce/core`](packages/core) | Decorator-based DI container | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/core.svg)](https://www.npmjs.com/package/@ambrosia-unce/core) |
| [`@ambrosia-unce/http`](packages/http) | Provider-agnostic HTTP layer | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/http.svg)](https://www.npmjs.com/package/@ambrosia-unce/http) |
| [`@ambrosia-unce/http-elysia`](packages/http-elysia) | Elysia.js HTTP adapter | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/http-elysia.svg)](https://www.npmjs.com/package/@ambrosia-unce/http-elysia) |
| [`@ambrosia-unce/validator`](packages/validator) | Compile-time type validation | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/validator.svg)](https://www.npmjs.com/package/@ambrosia-unce/validator) |
| [`@ambrosia-unce/config`](packages/config) | Type-safe environment config | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/config.svg)](https://www.npmjs.com/package/@ambrosia-unce/config) |
| [`@ambrosia-unce/events`](packages/events) | DI-integrated event bus | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/events.svg)](https://www.npmjs.com/package/@ambrosia-unce/events) |
| [`@ambrosia-unce/cli`](packages/cli) | Project scaffolding CLI | [![npm](https://img.shields.io/npm/v/@ambrosia-unce/cli.svg)](https://www.npmjs.com/package/@ambrosia-unce/cli) |

## Example

```typescript
import "reflect-metadata";
import { Injectable } from "@ambrosia-unce/core";
import { HttpApplication, Controller, Http, Param, type HttpPackDefinition } from "@ambrosia-unce/http";
import { ElysiaProvider } from "@ambrosia-unce/http-elysia";

@Injectable()
class GreetService {
  hello(name: string) {
    return { message: `Hello, ${name}!` };
  }
}

@Controller("/greet")
class GreetController {
  constructor(private greet: GreetService) {}

  @Http.Get("/:name")
  sayHello(@Param("name") name: string) {
    return this.greet.hello(name);
  }
}

const AppPack: HttpPackDefinition = {
  name: "AppPack",
  controllers: [GreetController],
  providers: [GreetService],
};

const app = await HttpApplication.create({
  provider: ElysiaProvider,
  packs: [AppPack],
});

await app.listen(3000);
```

## Pack Ecosystem

Packs are installable feature modules -- auth, logging, ORM integrations, and more. Browse and install from the [Pack Market](https://packs.ambrosia.dev).

```bash
ambrosia search auth        # find packs
ambrosia add @ambrosia-unce/auth # install a pack
ambrosia list               # view installed packs
```

## Documentation

Full documentation is available at [ambrosia.dev](https://ambrosia.dev).

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run `bun install` and `bun test` in the relevant package
4. Submit a pull request

We use [Biome](https://biomejs.dev/) for linting and formatting. Run `bun run check` to auto-fix.

## License

MIT
