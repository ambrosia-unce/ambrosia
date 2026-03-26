export type PackCategory =
  | "http"
  | "database"
  | "orm"
  | "auth"
  | "permissions"
  | "security"
  | "cache"
  | "config"
  | "logging"
  | "validation"
  | "testing"
  | "utils"
  | "microservices"
  | "messaging"
  | "websocket"
  | "graphql"
  | "scheduling"
  | "storage"
  | "monitoring"
  | "mail"
  | "notification"
  | "events"
  | "search"
  | "i18n"
  | "templating"
  | "payment"
  | "devtools"
  | "cloud"
  | "documentation";

export interface Pack {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: PackCategory;
  tags: string[];
  downloads: number;
  updatedAt: string;
  dependencies: string[];
  installCommand: string;
  featured: boolean;
  readme: string;
}

export const categoryConfig: Record<
  PackCategory,
  { label: string; color: string; icon: string }
> = {
  http: { label: "HTTP", color: "bg-cyan-500", icon: "Globe" },
  database: { label: "Database", color: "bg-purple-500", icon: "Database" },
  auth: { label: "Auth", color: "bg-orange-500", icon: "Shield" },
  cache: { label: "Cache", color: "bg-green-500", icon: "HardDrive" },
  logging: { label: "Logging", color: "bg-yellow-500", icon: "FileText" },
  validation: { label: "Validation", color: "bg-blue-500", icon: "CheckCircle" },
  testing: { label: "Testing", color: "bg-pink-500", icon: "FlaskConical" },
  utils: { label: "Utils", color: "bg-gray-500", icon: "Wrench" },
  microservices: { label: "Microservices", color: "bg-indigo-500", icon: "Network" },
  messaging: { label: "Messaging", color: "bg-rose-500", icon: "MessageSquare" },
  websocket: { label: "WebSocket", color: "bg-emerald-500", icon: "Radio" },
  graphql: { label: "GraphQL", color: "bg-fuchsia-500", icon: "Share2" },
  scheduling: { label: "Scheduling", color: "bg-amber-500", icon: "Clock" },
  storage: { label: "Storage", color: "bg-teal-500", icon: "FolderOpen" },
  monitoring: { label: "Monitoring", color: "bg-red-500", icon: "Activity" },
  orm: { label: "ORM", color: "bg-violet-500", icon: "Layers" },
  permissions: { label: "Permissions", color: "bg-orange-600", icon: "Lock" },
  security: { label: "Security", color: "bg-red-600", icon: "ShieldCheck" },
  config: { label: "Config", color: "bg-slate-500", icon: "Settings" },
  mail: { label: "Mail", color: "bg-sky-500", icon: "Mail" },
  notification: { label: "Notification", color: "bg-pink-600", icon: "Bell" },
  events: { label: "Events", color: "bg-lime-500", icon: "Zap" },
  search: { label: "Search", color: "bg-orange-400", icon: "Search" },
  i18n: { label: "i18n", color: "bg-cyan-600", icon: "Languages" },
  templating: { label: "Templating", color: "bg-stone-500", icon: "FileCode" },
  payment: { label: "Payment", color: "bg-green-600", icon: "CreditCard" },
  devtools: { label: "DevTools", color: "bg-zinc-500", icon: "Terminal" },
  cloud: { label: "Cloud", color: "bg-blue-600", icon: "Cloud" },
  documentation: { label: "Docs", color: "bg-purple-600", icon: "BookOpen" },
};

/**
 * Seed data — used by store.ts to bootstrap the registry on first run.
 * Pages no longer import this array directly; they read from the store.
 */
export const packs: Pack[] = [
  { slug: "core", name: "@ambrosia/core", description: "Standalone DI container with token-based injection, pack system, plugin architecture, and lifecycle management.", version: "0.4.2", author: "ambrosia", category: "utils", tags: ["di", "container", "ioc", "dependency-injection", "pack"], downloads: 12840, updatedAt: "2026-02-15", dependencies: ["reflect-metadata"], installCommand: "bun add @ambrosia/core", featured: true, readme: "" },
  { slug: "http", name: "@ambrosia/http", description: "Provider-agnostic HTTP layer with controllers, guards, interceptors, pipes, filters, middleware, SSE, and OpenAPI generation.", version: "0.3.1", author: "ambrosia", category: "http", tags: ["http", "server", "controller", "rest", "api", "openapi"], downloads: 9520, updatedAt: "2026-02-14", dependencies: ["@ambrosia/core", "reflect-metadata"], installCommand: "bun add @ambrosia/http", featured: true, readme: "" },
  { slug: "http-elysia", name: "@ambrosia/http-elysia", description: "Elysia.js adapter for @ambrosia/http.", version: "0.3.0", author: "ambrosia", category: "http", tags: ["elysia", "adapter", "http", "bun"], downloads: 7100, updatedAt: "2026-02-12", dependencies: ["@ambrosia/http", "elysia"], installCommand: "bun add @ambrosia/http-elysia", featured: true, readme: "" },
  { slug: "validator", name: "@ambrosia/validator", description: "Compile-time type validation via Bun preload TypeScript transformer.", version: "0.2.0", author: "ambrosia", category: "validation", tags: ["validation", "typescript", "compile-time", "transformer", "types"], downloads: 4300, updatedAt: "2026-02-10", dependencies: [], installCommand: "bun add @ambrosia/validator", featured: true, readme: "" },
  { slug: "cli", name: "@ambrosia/cli", description: "Scaffolding CLI for Ambrosia projects.", version: "0.1.5", author: "ambrosia", category: "utils", tags: ["cli", "scaffolding", "generator", "tool"], downloads: 3200, updatedAt: "2026-02-08", dependencies: [], installCommand: "bun add -g @ambrosia/cli", featured: false, readme: "" },
  { slug: "typeorm-pack", name: "@ambrosia/typeorm-pack", description: "TypeORM integration pack.", version: "0.1.2", author: "community", category: "database", tags: ["typeorm", "database", "orm", "postgres", "mysql"], downloads: 2100, updatedAt: "2026-01-28", dependencies: ["@ambrosia/core", "typeorm"], installCommand: "bun add @ambrosia/typeorm-pack", featured: false, readme: "" },
  { slug: "drizzle-pack", name: "@ambrosia/drizzle-pack", description: "Drizzle ORM integration pack.", version: "0.1.0", author: "community", category: "database", tags: ["drizzle", "database", "orm", "postgres", "sqlite"], downloads: 1850, updatedAt: "2026-02-05", dependencies: ["@ambrosia/core", "drizzle-orm"], installCommand: "bun add @ambrosia/drizzle-pack", featured: false, readme: "" },
  { slug: "jwt-auth-pack", name: "@ambrosia/jwt-auth-pack", description: "JWT authentication pack with guards, token generation, refresh tokens, and RBAC.", version: "0.2.1", author: "community", category: "auth", tags: ["jwt", "auth", "guard", "rbac", "security"], downloads: 3800, updatedAt: "2026-02-11", dependencies: ["@ambrosia/core", "@ambrosia/http", "jose"], installCommand: "bun add @ambrosia/jwt-auth-pack", featured: false, readme: "" },
  { slug: "redis-cache-pack", name: "@ambrosia/redis-cache-pack", description: "Redis caching pack with TTL support.", version: "0.1.3", author: "community", category: "cache", tags: ["redis", "cache", "ttl", "interceptor"], downloads: 2600, updatedAt: "2026-01-30", dependencies: ["@ambrosia/core", "ioredis"], installCommand: "bun add @ambrosia/redis-cache-pack", featured: false, readme: "" },
  { slug: "pino-logging-pack", name: "@ambrosia/pino-logging-pack", description: "Pino-based structured logging pack.", version: "0.1.1", author: "community", category: "logging", tags: ["pino", "logging", "structured", "correlation-id"], downloads: 1900, updatedAt: "2026-01-25", dependencies: ["@ambrosia/core", "pino"], installCommand: "bun add @ambrosia/pino-logging-pack", featured: false, readme: "" },
  { slug: "testing-utils", name: "@ambrosia/testing-utils", description: "Extended testing utilities.", version: "0.1.0", author: "ambrosia", category: "testing", tags: ["testing", "mock", "snapshot", "bun-test"], downloads: 1400, updatedAt: "2026-02-01", dependencies: ["@ambrosia/core"], installCommand: "bun add -D @ambrosia/testing-utils", featured: false, readme: "" },
  { slug: "config-pack", name: "@ambrosia/config-pack", description: "Configuration management pack.", version: "0.2.0", author: "ambrosia", category: "utils", tags: ["config", "env", "environment", "dotenv"], downloads: 3100, updatedAt: "2026-02-06", dependencies: ["@ambrosia/core"], installCommand: "bun add @ambrosia/config-pack", featured: false, readme: "" },
  { slug: "swagger-ui-pack", name: "@ambrosia/swagger-ui-pack", description: "Swagger UI integration.", version: "0.1.0", author: "community", category: "http", tags: ["swagger", "openapi", "documentation", "ui"], downloads: 2200, updatedAt: "2026-02-03", dependencies: ["@ambrosia/http", "swagger-ui-dist"], installCommand: "bun add @ambrosia/swagger-ui-pack", featured: false, readme: "" },
  { slug: "rate-limit-pack", name: "@ambrosia/rate-limit-pack", description: "Rate limiting guard.", version: "0.1.0", author: "community", category: "http", tags: ["rate-limit", "guard", "throttle", "security"], downloads: 1600, updatedAt: "2026-01-20", dependencies: ["@ambrosia/core", "@ambrosia/http"], installCommand: "bun add @ambrosia/rate-limit-pack", featured: false, readme: "" },

  // Messaging
  { slug: "rabbitmq-pack", name: "@ambrosia/rabbitmq-pack", description: "RabbitMQ messaging pack with decorators for consumers, publishers, and RPC patterns.", version: "0.1.0", author: "community", category: "messaging", tags: ["rabbitmq", "amqp", "queue", "events", "pub-sub"], downloads: 1200, updatedAt: "2026-02-08", dependencies: ["@ambrosia/core", "amqplib"], installCommand: "bun add @ambrosia/rabbitmq-pack", featured: false, readme: "" },
  { slug: "nats-pack", name: "@ambrosia/nats-pack", description: "NATS messaging integration with request-reply and pub/sub support.", version: "0.1.0", author: "community", category: "messaging", tags: ["nats", "messaging", "pub-sub", "request-reply"], downloads: 820, updatedAt: "2026-01-30", dependencies: ["@ambrosia/core", "nats"], installCommand: "bun add @ambrosia/nats-pack", featured: false, readme: "" },

  // WebSocket
  { slug: "ws-pack", name: "@ambrosia/ws-pack", description: "WebSocket gateway pack with rooms, namespaces, and decorator-based event handlers.", version: "0.1.1", author: "community", category: "websocket", tags: ["websocket", "ws", "realtime", "gateway", "rooms"], downloads: 2400, updatedAt: "2026-02-10", dependencies: ["@ambrosia/core", "@ambrosia/http"], installCommand: "bun add @ambrosia/ws-pack", featured: false, readme: "" },
  { slug: "sse-pack", name: "@ambrosia/sse-pack", description: "Server-Sent Events helpers with auto-reconnect and typed event channels.", version: "0.1.0", author: "community", category: "websocket", tags: ["sse", "server-sent-events", "realtime", "streaming"], downloads: 950, updatedAt: "2026-01-22", dependencies: ["@ambrosia/core", "@ambrosia/http"], installCommand: "bun add @ambrosia/sse-pack", featured: false, readme: "" },

  // GraphQL
  { slug: "graphql-pack", name: "@ambrosia/graphql-pack", description: "GraphQL integration with schema-first and code-first approaches, subscriptions, and DataLoader.", version: "0.2.0", author: "community", category: "graphql", tags: ["graphql", "schema", "resolvers", "subscriptions", "dataloader"], downloads: 2800, updatedAt: "2026-02-12", dependencies: ["@ambrosia/core", "graphql", "graphql-yoga"], installCommand: "bun add @ambrosia/graphql-pack", featured: false, readme: "" },

  // Scheduling
  { slug: "cron-pack", name: "@ambrosia/cron-pack", description: "Cron-based task scheduling with @Cron() decorator and distributed lock support.", version: "0.1.2", author: "community", category: "scheduling", tags: ["cron", "scheduler", "jobs", "tasks", "periodic"], downloads: 1700, updatedAt: "2026-02-04", dependencies: ["@ambrosia/core", "croner"], installCommand: "bun add @ambrosia/cron-pack", featured: false, readme: "" },
  { slug: "queue-pack", name: "@ambrosia/queue-pack", description: "Background job queue with retries, priorities, and concurrency control.", version: "0.1.0", author: "community", category: "scheduling", tags: ["queue", "jobs", "background", "worker", "retry"], downloads: 1100, updatedAt: "2026-01-28", dependencies: ["@ambrosia/core"], installCommand: "bun add @ambrosia/queue-pack", featured: false, readme: "" },

  // Storage
  { slug: "s3-storage-pack", name: "@ambrosia/s3-storage-pack", description: "S3-compatible object storage pack with presigned URLs, multipart upload, and bucket management.", version: "0.1.1", author: "community", category: "storage", tags: ["s3", "storage", "upload", "minio", "r2"], downloads: 1500, updatedAt: "2026-02-06", dependencies: ["@ambrosia/core", "@aws-sdk/client-s3"], installCommand: "bun add @ambrosia/s3-storage-pack", featured: false, readme: "" },
  { slug: "multer-pack", name: "@ambrosia/multer-pack", description: "File upload handling with disk and memory storage strategies.", version: "0.1.0", author: "community", category: "storage", tags: ["upload", "multipart", "file", "form-data"], downloads: 1300, updatedAt: "2026-01-25", dependencies: ["@ambrosia/core", "@ambrosia/http"], installCommand: "bun add @ambrosia/multer-pack", featured: false, readme: "" },

  // Monitoring
  { slug: "health-pack", name: "@ambrosia/health-pack", description: "Health check endpoints with database, memory, disk, and custom indicator support.", version: "0.1.2", author: "ambrosia", category: "monitoring", tags: ["health", "healthcheck", "readiness", "liveness", "k8s"], downloads: 2100, updatedAt: "2026-02-09", dependencies: ["@ambrosia/core", "@ambrosia/http"], installCommand: "bun add @ambrosia/health-pack", featured: false, readme: "" },
  { slug: "opentelemetry-pack", name: "@ambrosia/opentelemetry-pack", description: "OpenTelemetry integration with automatic tracing, metrics, and log correlation.", version: "0.1.0", author: "community", category: "monitoring", tags: ["opentelemetry", "tracing", "metrics", "observability", "spans"], downloads: 980, updatedAt: "2026-02-01", dependencies: ["@ambrosia/core", "@opentelemetry/sdk-node"], installCommand: "bun add @ambrosia/opentelemetry-pack", featured: false, readme: "" },

  // Microservices (was empty)
  { slug: "grpc-pack", name: "@ambrosia/grpc-pack", description: "gRPC transport with proto-first service definitions and streaming support.", version: "0.1.0", author: "community", category: "microservices", tags: ["grpc", "protobuf", "rpc", "streaming", "transport"], downloads: 1050, updatedAt: "2026-02-03", dependencies: ["@ambrosia/core", "@grpc/grpc-js", "@grpc/proto-loader"], installCommand: "bun add @ambrosia/grpc-pack", featured: false, readme: "" },
];
