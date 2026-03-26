interface FileEntry {
  path: string;
  content: string;
}

export function buildCleanFiles(name: string): FileEntry[] {
  return [
    { path: "src/main.ts", content: mainTs() },
    { path: "src/app.pack.ts", content: appPackTs() },

    // Domain layer
    { path: "src/domain/entities/user.entity.ts", content: userEntityTs() },
    { path: "src/domain/repositories/user.repository.ts", content: userRepositoryPortTs() },

    // Application layer
    { path: "src/application/use-cases/create-user.use-case.ts", content: createUserUseCaseTs() },
    { path: "src/application/use-cases/get-user.use-case.ts", content: getUserUseCaseTs() },
    { path: "src/application/use-cases/list-users.use-case.ts", content: listUsersUseCaseTs() },
    { path: "src/application/use-cases/delete-user.use-case.ts", content: deleteUserUseCaseTs() },
    { path: "src/application/dto/create-user.dto.ts", content: createUserDtoTs() },
    { path: "src/application/dto/user-response.dto.ts", content: userResponseDtoTs() },

    // Infrastructure layer
    {
      path: "src/infrastructure/persistence/in-memory-user.repository.ts",
      content: inMemoryUserRepoTs(),
    },
    { path: "src/infrastructure/infrastructure.pack.ts", content: infrastructurePackTs() },

    // Presentation layer
    { path: "src/presentation/controllers/health.controller.ts", content: healthControllerTs() },
    { path: "src/presentation/controllers/user.controller.ts", content: userControllerTs() },
    { path: "src/presentation/api.pack.ts", content: apiPackTs() },

    // Common
    { path: "src/common/guards/auth.guard.ts", content: authGuardTs() },
    { path: "src/common/interceptors/logging.interceptor.ts", content: loggingInterceptorTs() },
    { path: "src/common/filters/http-exception.filter.ts", content: httpExceptionFilterTs() },
    { path: "src/common/middleware/cors.middleware.ts", content: corsMiddlewareTs() },

    // Tests
    { path: "test/app.test.ts", content: appTestTs() },
  ];
}

// --- Domain Layer ---

function userEntityTs(): string {
  return `export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  update(data: { name?: string; email?: string }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    this.updatedAt = new Date();
  }
}
`;
}

function userRepositoryPortTs(): string {
  return `import type { User } from "../entities/user.entity";

/**
 * Abstract repository — serves as a DI token and port definition.
 * Infrastructure layer provides the concrete implementation via @Implements().
 */
export abstract class UserRepository {
  abstract findAll(): User[];
  abstract findById(id: number): User | undefined;
  abstract create(data: { name: string; email: string }): User;
  abstract update(id: number, data: { name?: string; email?: string }): User | undefined;
  abstract delete(id: number): boolean;
}
`;
}

// --- Application Layer ---

function createUserDtoTs(): string {
  return `export interface CreateUserDto {
  name: string;
  email: string;
}
`;
}

function userResponseDtoTs(): string {
  return `export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
`;
}

function createUserUseCaseTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import { UserRepository } from "../../domain/repositories/user.repository";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { User } from "../../domain/entities/user.entity";

@Injectable()
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(dto: CreateUserDto): User {
    return this.userRepository.create(dto);
  }
}
`;
}

function getUserUseCaseTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import { UserRepository } from "../../domain/repositories/user.repository";
import type { User } from "../../domain/entities/user.entity";

@Injectable()
export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(id: number): User | undefined {
    return this.userRepository.findById(id);
  }
}
`;
}

function listUsersUseCaseTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import { UserRepository } from "../../domain/repositories/user.repository";
import type { User } from "../../domain/entities/user.entity";

@Injectable()
export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(): User[] {
    return this.userRepository.findAll();
  }
}
`;
}

function deleteUserUseCaseTs(): string {
  return `import { Injectable } from "@ambrosia/core";
import { UserRepository } from "../../domain/repositories/user.repository";

@Injectable()
export class DeleteUserUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(id: number): boolean {
    return this.userRepository.delete(id);
  }
}
`;
}

// --- Infrastructure Layer ---

function inMemoryUserRepoTs(): string {
  return `import { Injectable, Implements } from "@ambrosia/core";
import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";

@Injectable()
@Implements(UserRepository)
export class InMemoryUserRepository extends UserRepository {
  private users: User[] = [];
  private nextId = 1;

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(data: { name: string; email: string }): User {
    const user = new User(
      this.nextId++,
      data.name,
      data.email,
      new Date(),
      new Date(),
    );
    this.users.push(user);
    return user;
  }

  update(id: number, data: { name?: string; email?: string }): User | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    user.update(data);
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

function infrastructurePackTs(): string {
  return `import type { PackDefinition } from "@ambrosia/core";
import { InMemoryUserRepository } from "./persistence/in-memory-user.repository";

/**
 * Infrastructure pack — provides concrete implementations of domain ports.
 * Swap this pack to change persistence (e.g., SQLite, PostgreSQL).
 */
export const InfrastructurePack: PackDefinition = {
  providers: [InMemoryUserRepository],
  exports: [InMemoryUserRepository],
};
`;
}

// --- Presentation Layer ---

function healthControllerTs(): string {
  return `import { Controller, Http } from "@ambrosia/http";

@Controller("/health")
export class HealthController {
  private readonly startedAt = new Date();

  @Http.Get("/")
  check() {
    return {
      status: "ok",
      uptime: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Http.Get("/ready")
  readiness() {
    return { status: "ready", timestamp: new Date().toISOString() };
  }
}
`;
}

function userControllerTs(): string {
  return `import { Controller, Http, Body, Param, Status } from "@ambrosia/http";
import { NotFoundException } from "@ambrosia/http";
import { assert } from "@ambrosia/validator";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import type { CreateUserDto } from "../../application/dto/create-user.dto";

@Controller("/users")
export class UserController {
  constructor(
    private createUser: CreateUserUseCase,
    private getUser: GetUserUseCase,
    private listUsers: ListUsersUseCase,
    private deleteUser: DeleteUserUseCase,
  ) {}

  @Http.Get("/")
  findAll() {
    const users = this.listUsers.execute();
    return { data: users, count: users.length };
  }

  @Http.Get("/:id")
  findOne(@Param("id") id: string) {
    const user = this.getUser.execute(Number(id));
    if (!user) throw new NotFoundException(\`User #\${id} not found\`);
    return { data: user };
  }

  @Http.Post("/")
  @Status(201)
  create(@Body() body: unknown) {
    const dto = assert<CreateUserDto>(body);
    const user = this.createUser.execute(dto);
    return { data: user };
  }

  @Http.Delete("/:id")
  remove(@Param("id") id: string) {
    const deleted = this.deleteUser.execute(Number(id));
    if (!deleted) throw new NotFoundException(\`User #\${id} not found\`);
    return { message: \`User #\${id} deleted\` };
  }
}
`;
}

function apiPackTs(): string {
  return `import type { HttpPackDefinition } from "@ambrosia/http";
import { HealthController } from "./controllers/health.controller";
import { UserController } from "./controllers/user.controller";
import { CreateUserUseCase } from "../application/use-cases/create-user.use-case";
import { GetUserUseCase } from "../application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "../application/use-cases/list-users.use-case";
import { DeleteUserUseCase } from "../application/use-cases/delete-user.use-case";

export const ApiPack: HttpPackDefinition = {
  controllers: [HealthController, UserController],
  providers: [CreateUserUseCase, GetUserUseCase, ListUsersUseCase, DeleteUserUseCase],
};
`;
}

// --- Root ---

function appPackTs(): string {
  return `import type { PackDefinition } from "@ambrosia/core";
import { InfrastructurePack } from "./infrastructure/infrastructure.pack";
import { ApiPack } from "./presentation/api.pack";

/**
 * Root pack — composes infrastructure and presentation layers.
 *
 * Domain and Application layers are pure TypeScript with no pack coupling.
 * Infrastructure provides implementations of domain ports.
 * Presentation provides HTTP controllers consuming application use cases.
 */
export const AppPack: PackDefinition = {
  imports: [InfrastructurePack, ApiPack],
};
`;
}

function mainTs(): string {
  return `import "reflect-metadata";
import { HttpApplication } from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";
import { AppPack } from "./app.pack";

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

// --- Common ---

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

// --- Tests ---

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
  });
});
`;
}
