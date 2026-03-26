# @ambrosia-unce/validator

Type-safe compile-time validation for Ambrosia framework using Bun plugin system and TypeScript Compiler API.

## Features

- ✅ **Zero runtime overhead** - Validation code generated at compile-time
- ✅ **Type-safe** - Full TypeScript type inference
- ✅ **No decorators** - Just TypeScript types
- ✅ **No schema duplication** - Types are the schema
- ✅ **Branded types** - Email, UUID, PositiveInt, and more
- ✅ **JSDoc constraints** - @minLength, @pattern, etc.
- ✅ **Bun native** - Uses Bun plugin system

## Installation

```bash
bun add @ambrosia-unce/validator
```

## Setup

Add to your `bunfig.toml`:

```toml
preload = ["@ambrosia-unce/validator/preload"]
```

That's it! The plugin is now active.

## Usage

### Basic validation

```typescript
import { validate, assert, is } from '@ambrosia-unce/validator';

interface User {
  name: string;
  email: string;
  age: number;
}

// validate<T>() - Returns result object
const result = validate<User>(data);
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.errors);
}

// assert<T>() - Throws on error
try {
  const user = assert<User>(data);
  console.log(user.name);
} catch (error) {
  console.error(error);
}

// is<T>() - Type guard
if (is<User>(data)) {
  // data is User here
  console.log(data.name);
}
```

### Branded types

```typescript
import type { Email, UUID, PositiveInt } from '@ambrosia-unce/validator/types';

interface User {
  id: UUID;
  email: Email;
  age: PositiveInt;
  name: string;
}

const user = assert<User>({
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  name: "Alice"
});
```

Available branded types:
- `Email` - RFC 5322 email
- `UUID` - UUID v4
- `URL` - Valid HTTP/HTTPS URL
- `PositiveInt` - Integer > 0
- `NonNegativeInt` - Integer >= 0
- `DateString` - ISO 8601 date
- `DateTime` - ISO 8601 datetime
- `PhoneNumber` - E.164 format
- `IPv4`, `IPv6` - IP addresses
- `HexColor` - #RRGGBB or #RGB
- And more...

### JSDoc constraints

```typescript
interface UpdateUserDto {
  /**
   * @minLength 3
   * @maxLength 50
   * @pattern ^[a-zA-Z0-9_]+$
   */
  name?: string;

  /**
   * @format email
   */
  email?: string;

  /**
   * @minimum 18
   * @maximum 120
   */
  age?: number;
}

const dto = assert<UpdateUserDto>(data);
```

### With Ambrosia HTTP

```typescript
import { Controller, Post, Body } from '@ambrosia-unce/http';
import { assert } from '@ambrosia-unce/validator';

interface CreateUserDto {
  name: string;
  email: string;
}

@Controller('/users')
export class UserController {
  @Post('/')
  async create(@Body() data: unknown) {
    const dto = assert<CreateUserDto>(data);
    // dto is validated and typed!
    return this.userService.create(dto);
  }
}
```

## How it works

The plugin uses TypeScript Compiler API to:

1. Find all `validate<T>()`, `assert<T>()`, `is<T>()` calls
2. Analyze the type `T` using TypeScript's type checker
3. Generate optimized inline validation code
4. Replace the function call with generated code

### Before transformation:

```typescript
const user = assert<User>(data);
```

### After transformation:

```typescript
const user = ((data) => {
  if (typeof data !== "object" || data === null)
    throw new ValidationError("must be an object");
  if (typeof data.name !== "string")
    throw new ValidationError("name must be string");
  if (typeof data.email !== "string")
    throw new ValidationError("email must be string");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw new ValidationError("email must be valid");
  if (typeof data.age !== "number")
    throw new ValidationError("age must be number");
  return data;
})(data);
```

## Configuration

Custom plugin options:

```typescript
// validator-config.ts
import { plugin } from "bun";
import { createValidatorPlugin } from "@ambrosia-unce/validator/plugin";

plugin(createValidatorPlugin({
  debug: true, // Enable debug logging
  include: /\.ts$/, // File patterns to include
  exclude: /node_modules/, // File patterns to exclude
}));
```

Then in `bunfig.toml`:

```toml
preload = ["./validator-config.ts"]
```

## License

MIT
