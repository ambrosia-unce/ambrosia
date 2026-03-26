# @ambrosia/http-elysia

[Elysia.js](https://elysiajs.com/) HTTP adapter for the Ambrosia framework.

## Overview

This package implements the `HttpProvider` interface from `@ambrosia/http` using Elysia.js as the underlying HTTP server. It provides two main components:

- **`ElysiaProvider`** — implements the `HttpProvider` interface, bridging Ambrosia's HTTP layer with Elysia
- **`ElysiaContextAdapter`** — converts Elysia's request context into Ambrosia's `HttpContext`

## Installation

```bash
bun add @ambrosia/http-elysia elysia
```

## Usage

```typescript
import "reflect-metadata";
import { HttpApplication } from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";

const app = await HttpApplication.create({
  provider: new ElysiaProvider(),
  packs: [AppPack],
});

app.listen(3000);
```

## Requirements

- Bun >= 1.3.6
- Elysia >= 1.0.0

## License

MIT
