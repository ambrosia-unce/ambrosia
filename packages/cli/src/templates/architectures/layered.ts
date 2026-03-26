interface FileEntry {
  path: string;
  content: string;
}

export function buildLayeredFiles(name: string): FileEntry[] {
  return [
    { path: "src/main.ts", content: mainTs() },
    { path: "src/packs/app.pack.ts", content: appPack() },
    { path: "src/config/app.config.ts", content: appConfig() },

    // Controllers
    { path: "src/controllers/health.controller.ts", content: healthControllerTs() },
    { path: "src/controllers/user.controller.ts", content: userControllerTs() },

    // Services
    { path: "src/services/health.service.ts", content: healthServiceTs() },
    { path: "src/services/user.service.ts", content: userServiceTs() },

    // Repositories
    { path: "src/repositories/user.repository.ts", content: userRepositoryTs() },

    // Models
    { path: "src/models/user.model.ts", content: userModelTs() },

    // Common
    { path: "src/common/guards/auth.guard.ts", content: authGuardTs() },
    { path: "src/common/interceptors/logging.interceptor.ts", content: loggingInterceptorTs() },
    { path: "src/common/filters/http-exception.filter.ts", content: httpExceptionFilterTs() },
    { path: "src/common/middleware/cors.middleware.ts", content: corsMiddlewareTs() },

    // Tests
    { path: "test/app.test.ts", content: appTestTs() },
  ];
}

// --- Templates ---

function mainTs(): string {
  return `import "reflect-metadata";
import { HttpApplication } from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";
import { AppPack } from "./packs/app.pack";

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;

  const app = await HttpApplication.create({
    provider: ElysiaProvider,
    prefix: "/api",
    port,
    packs: [AppPack],
  });

  await app.listen();
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
`;
}

function appPack(): string {
  return `import type { HttpPackDefinition } from "@ambrosia/http";
import { HealthController } from "../controllers/health.controller";
import { UserController } from "../controllers/user.controller";
import { HealthService } from "../services/health.service";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/user.repository";

export const AppPack: HttpPackDefinition = {
  controllers: [HealthController, UserController],
  providers: [HealthService, UserService, UserRepository],
};
`;
}

function appConfig(): string {
  return `import { InjectionToken } from "@ambrosia/core";

export interface AppConfig {
  port: number;
  env: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>("AppConfig");
`;
}

function healthControllerTs(): string {
  return `import { Controller, Http } from "@ambrosia/http";
import { HealthService } from "../services/health.service";

@Controller("/health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Http.Get("/")
  check() {
    return this.healthService.check();
  }

  @Http.Get("/ready")
  readiness() {
    return this.healthService.checkReadiness();
  }
}
`;
}

function userControllerTs(): string {
  return `import { Controller, Http, Body, Param, Status } from "@ambrosia/http";
import { NotFoundException } from "@ambrosia/http";
import { assert } from "@ambrosia/validator";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Http.Get("/")
  findAll() {
    const users = this.userService.findAll();
    return { data: users, count: users.length };
  }

  @Http.Get("/:id")
  findOne(@Param("id") id: string) {
    const user = this.userService.findOne(Number(id));
    if (!user) throw new NotFoundException(\`User #\${id} not found\`);
    return { data: user };
  }

  @Http.Post("/")
  @Status(201)
  create(@Body() body: unknown) {
    const dto = assert<{ name: string; email: string }>(body);
    const user = this.userService.create(dto);
    return { data: user };
  }

  @Http.Put("/:id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const dto = assert<{ name?: string; email?: string }>(body);
    const user = this.userService.update(Number(id), dto);
    if (!user) throw new NotFoundException(\`User #\${id} not found\`);
    return { data: user };
  }

  @Http.Delete("/:id")
  remove(@Param("id") id: string) {
    const deleted = this.userService.remove(Number(id));
    if (!deleted) throw new NotFoundException(\`User #\${id} not found\`);
    return { message: \`User #\${id} deleted\` };
  }
}
`;
}

function healthServiceTs(): string {
  return `import { Injectable } from "@ambrosia/core";

@Injectable()
export class HealthService {
  private readonly startedAt = new Date();

  check() {
    return {
      status: "ok",
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
    };
  }

  checkReadiness() {
    return {
      status: "ready",
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
  }
}
`;
}

function userServiceTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import { UserRepository } from "../repositories/user.repository";
import type { User } from "../models/user.model";

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  findAll(): User[] {
    return this.userRepository.findAll();
  }

  findOne(id: number): User | undefined {
    return this.userRepository.findById(id);
  }

  create(data: { name: string; email: string }): User {
    return this.userRepository.create(data);
  }

  update(id: number, data: { name?: string; email?: string }): User | undefined {
    return this.userRepository.update(id, data);
  }

  remove(id: number): boolean {
    return this.userRepository.delete(id);
  }
}
`;
}

function userRepositoryTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import type { User } from "../models/user.model";

@Injectable()
export class UserRepository {
  private users: User[] = [];
  private nextId = 1;

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(data: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const user: User = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  update(id: number, data: Partial<Pick<User, "name" | "email">>): User | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    user.updatedAt = new Date();
    return user;
  }

  delete(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
`;
}

function userModelTs(): string {
  return `export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
`;
}

function authGuardTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import type { Guard, ExecutionContext } from "@ambrosia/http";
import { UnauthorizedException } from "@ambrosia/http";

@Injectable()
export class AuthGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers["authorization"];

    if (!token) {
      throw new UnauthorizedException("Missing authorization header");
    }

    // TODO: Replace with real token validation
    return true;
  }
}
`;
}

function loggingInterceptorTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import type { Interceptor, ExecutionContext, CallHandler } from "@ambrosia/http";

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const start = performance.now();

    const result = await next.handle();

    const duration = (performance.now() - start).toFixed(2);
    console.log(\`[\${method}] \${path} - \${duration}ms\`);

    return result;
  }
}
`;
}

function httpExceptionFilterTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import type { ExceptionFilter, ExceptionFilterArgs } from "@ambrosia/http";
import { HttpException } from "@ambrosia/http";

@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs) {
    const { exception } = args;

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.getMessage(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode: 500,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    };
  }
}
`;
}

function corsMiddlewareTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import type { Middleware, IHttpRequest, IHttpResponse } from "@ambrosia/http";

@Injectable()
export class CorsMiddleware implements Middleware {
  async use(req: IHttpRequest, res: IHttpResponse, next: () => Promise<void>) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    await next();
  }
}
`;
}

function appTestTs(): string {
  return `import { describe, it, expect } from "bun:test";

const BASE_URL = "http://localhost:3000/api";

describe("App", () => {
  it("should respond to health check", async () => {
    const res = await fetch(\`\${BASE_URL}/health\`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("should list users", async () => {
    const res = await fetch(\`\${BASE_URL}/users\`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeArray();
    expect(body.count).toBeNumber();
  });

  it("should create a user", async () => {
    const res = await fetch(\`\${BASE_URL}/users\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alice", email: "alice@example.com" }),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.name).toBe("Alice");
    expect(body.data.email).toBe("alice@example.com");
    expect(body.data.id).toBeNumber();
  });
});
`;
}
