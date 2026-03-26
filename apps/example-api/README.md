# Ambrosia Example API

A task management REST API demonstrating all Ambrosia framework features working together.

## Features Demonstrated

- **DI & Packs** -- modular composition with imports/exports
- **HTTP Controllers** -- full CRUD with all HTTP methods
- **Guards** -- token-based auth on protected routes
- **Interceptors** -- request logging with timing
- **Pipes** -- input validation
- **Exception Filters** -- global error handling with consistent format
- **Config** -- typed environment configuration
- **Events** -- domain events with listeners (UserCreated, TaskCompleted)
- **Parameter decorators** -- @Body, @Param, @Query, @Status, @UseGuard

## Architecture

```
AppPack (root)
  |-- ConfigModule.forRoot()     Typed env config
  |-- EventBusModule.forRoot()   Domain event bus
  |-- AuthPack                   AuthGuard provider
  |-- UserPack                   UserController + UserService
  |-- TaskPack                   TaskController + TaskService
  |-- NotificationListener       Event subscriber
```

Request pipeline per route:

```
Middleware -> Guards -> Interceptors -> [Param resolution + Pipes] -> Handler -> Filters
```

## Quick Start

```bash
# From monorepo root
bun install

# Copy env file
cp apps/example-api/.env.example apps/example-api/.env

# Run the server
cd apps/example-api
bun run dev
```

The server starts on http://localhost:3000 by default.

## API Endpoints

### Users (public)

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# List all users
curl http://localhost:3000/users

# Get user by id
curl http://localhost:3000/users/1
```

### Tasks (auth required for writes)

Protected endpoints require an Authorization header with any non-empty bearer token:

```bash
# Create a task (requires auth)
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{"title": "Write docs", "description": "Document all API endpoints"}'

# List all tasks (public)
curl http://localhost:3000/tasks

# Filter by status
curl "http://localhost:3000/tasks?status=pending"

# Get task by id (public)
curl http://localhost:3000/tasks/1

# Update a task (requires auth)
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{"status": "in_progress"}'

# Mark task as completed (requires auth, fires event)
curl -X PATCH http://localhost:3000/tasks/1/complete \
  -H "Authorization: Bearer demo-token"

# Delete a task (requires auth)
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer demo-token"
```

### Auth errors

```bash
# Missing token -> 401
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Fail"}'

# Invalid format -> 401
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: InvalidFormat" \
  -H "Content-Type: application/json" \
  -d '{"title": "Fail"}'
```

## Environment Variables

| Variable       | Type    | Default              | Description          |
|----------------|---------|----------------------|----------------------|
| `PORT`         | int     | 3000                 | Server port          |
| `APP_NAME`     | string  | Ambrosia Example API | Application name     |
| `LOG_LEVEL`    | string  | debug                | Logging level        |
| `AUTH_ENABLED` | bool    | true                 | Enable auth guard    |
