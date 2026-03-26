interface FileEntry {
  path: string;
  content: string;
}

export function buildCqrsFiles(name: string): FileEntry[] {
  return [
    { path: "src/main.ts", content: mainTs() },
    { path: "src/app.pack.ts", content: appPackTs() },

    // Shared CQRS infrastructure
    { path: "src/shared/cqrs/interfaces.ts", content: cqrsInterfacesTs() },
    { path: "src/shared/cqrs/command-bus.ts", content: commandBusTs() },
    { path: "src/shared/cqrs/query-bus.ts", content: queryBusTs() },
    { path: "src/shared/shared.pack.ts", content: sharedPackTs() },

    // Health module
    { path: "src/modules/health/health.controller.ts", content: healthControllerTs() },
    { path: "src/modules/health/health.service.ts", content: healthServiceTs() },
    { path: "src/modules/health/health.pack.ts", content: healthPackTs() },

    // User module — commands
    { path: "src/modules/user/commands/create-user.command.ts", content: createUserCommandTs() },
    { path: "src/modules/user/commands/delete-user.command.ts", content: deleteUserCommandTs() },
    {
      path: "src/modules/user/commands/handlers/create-user.handler.ts",
      content: createUserHandlerTs(),
    },
    {
      path: "src/modules/user/commands/handlers/delete-user.handler.ts",
      content: deleteUserHandlerTs(),
    },

    // User module — queries
    { path: "src/modules/user/queries/get-user.query.ts", content: getUserQueryTs() },
    { path: "src/modules/user/queries/list-users.query.ts", content: listUsersQueryTs() },
    { path: "src/modules/user/queries/handlers/get-user.handler.ts", content: getUserHandlerTs() },
    {
      path: "src/modules/user/queries/handlers/list-users.handler.ts",
      content: listUsersHandlerTs(),
    },

    // User module — model, controller, pack
    { path: "src/modules/user/models/user.model.ts", content: userModelTs() },
    { path: "src/modules/user/user.store.ts", content: userStoreTs() },
    { path: "src/modules/user/user.controller.ts", content: userControllerTs() },
    { path: "src/modules/user/user.pack.ts", content: userPackTs() },

    // Common
    { path: "src/common/guards/auth.guard.ts", content: authGuardTs() },
    { path: "src/common/interceptors/logging.interceptor.ts", content: loggingInterceptorTs() },
    { path: "src/common/filters/http-exception.filter.ts", content: httpExceptionFilterTs() },
    { path: "src/common/middleware/cors.middleware.ts", content: corsMiddlewareTs() },

    // Tests
    { path: "test/app.test.ts", content: appTestTs() },
  ];
}

// --- CQRS Infrastructure ---

function cqrsInterfacesTs(): string {
  return `export interface Command {
  readonly type: string;
}

export interface Query {
  readonly type: string;
}

export interface CommandHandler<TCommand extends Command = Command, TResult = void> {
  execute(command: TCommand): TResult | Promise<TResult>;
}

export interface QueryHandler<TQuery extends Query = Query, TResult = unknown> {
  execute(query: TQuery): TResult | Promise<TResult>;
}
`;
}

function commandBusTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Command, CommandHandler } from "./interfaces";

@Injectable()
export class CommandBus {
  private handlers = new Map<string, CommandHandler>();

  register(commandType: string, handler: CommandHandler): void {
    this.handlers.set(commandType, handler);
  }

  async execute<TResult = void>(command: Command): Promise<TResult> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(\`No handler registered for command: \${command.type}\`);
    }
    return handler.execute(command) as Promise<TResult>;
  }
}
`;
}

function queryBusTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Query, QueryHandler } from "./interfaces";

@Injectable()
export class QueryBus {
  private handlers = new Map<string, QueryHandler>();

  register(queryType: string, handler: QueryHandler): void {
    this.handlers.set(queryType, handler);
  }

  async execute<TResult = unknown>(query: Query): Promise<TResult> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(\`No handler registered for query: \${query.type}\`);
    }
    return handler.execute(query) as Promise<TResult>;
  }
}
`;
}

function sharedPackTs(): string {
  return `import type { PackDefinition } from "@ambrosia-unce/core";
import { CommandBus } from "./cqrs/command-bus";
import { QueryBus } from "./cqrs/query-bus";

export const SharedPack: PackDefinition = {
  providers: [CommandBus, QueryBus],
  exports: [CommandBus, QueryBus],
};
`;
}

// --- Health Module ---

function healthControllerTs(): string {
  return `import { Controller, Http } from "@ambrosia-unce/http";
import { HealthService } from "./health.service";

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

function healthServiceTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";

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

function healthPackTs(): string {
  return `import type { HttpPackDefinition } from "@ambrosia-unce/http";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

export const HealthPack: HttpPackDefinition = {
  controllers: [HealthController],
  providers: [HealthService],
};
`;
}

// --- User Commands ---

function createUserCommandTs(): string {
  return `import type { Command } from "../../../shared/cqrs/interfaces";

export class CreateUserCommand implements Command {
  readonly type = "CreateUser";

  constructor(
    public readonly name: string,
    public readonly email: string,
  ) {}
}
`;
}

function deleteUserCommandTs(): string {
  return `import type { Command } from "../../../shared/cqrs/interfaces";

export class DeleteUserCommand implements Command {
  readonly type = "DeleteUser";

  constructor(public readonly id: number) {}
}
`;
}

function createUserHandlerTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { CommandHandler } from "../../../../shared/cqrs/interfaces";
import type { CreateUserCommand } from "../create-user.command";
import { UserStore } from "../../user.store";
import type { User } from "../../models/user.model";

@Injectable()
export class CreateUserHandler implements CommandHandler<CreateUserCommand, User> {
  constructor(private userStore: UserStore) {}

  execute(command: CreateUserCommand): User {
    return this.userStore.create({ name: command.name, email: command.email });
  }
}
`;
}

function deleteUserHandlerTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { CommandHandler } from "../../../../shared/cqrs/interfaces";
import type { DeleteUserCommand } from "../delete-user.command";
import { UserStore } from "../../user.store";

@Injectable()
export class DeleteUserHandler implements CommandHandler<DeleteUserCommand, boolean> {
  constructor(private userStore: UserStore) {}

  execute(command: DeleteUserCommand): boolean {
    return this.userStore.delete(command.id);
  }
}
`;
}

// --- User Queries ---

function getUserQueryTs(): string {
  return `import type { Query } from "../../../shared/cqrs/interfaces";

export class GetUserQuery implements Query {
  readonly type = "GetUser";

  constructor(public readonly id: number) {}
}
`;
}

function listUsersQueryTs(): string {
  return `import type { Query } from "../../../shared/cqrs/interfaces";

export class ListUsersQuery implements Query {
  readonly type = "ListUsers";
}
`;
}

function getUserHandlerTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { QueryHandler } from "../../../../shared/cqrs/interfaces";
import type { GetUserQuery } from "../get-user.query";
import { UserStore } from "../../user.store";
import type { User } from "../../models/user.model";

@Injectable()
export class GetUserHandler implements QueryHandler<GetUserQuery, User | undefined> {
  constructor(private userStore: UserStore) {}

  execute(query: GetUserQuery): User | undefined {
    return this.userStore.findById(query.id);
  }
}
`;
}

function listUsersHandlerTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { QueryHandler } from "../../../../shared/cqrs/interfaces";
import type { ListUsersQuery } from "../list-users.query";
import { UserStore } from "../../user.store";
import type { User } from "../../models/user.model";

@Injectable()
export class ListUsersHandler implements QueryHandler<ListUsersQuery, User[]> {
  constructor(private userStore: UserStore) {}

  execute(_query: ListUsersQuery): User[] {
    return this.userStore.findAll();
  }
}
`;
}

// --- User Model & Store ---

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

function userStoreTs(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { User } from "./models/user.model";

@Injectable()
export class UserStore {
  private users: User[] = [];
  private nextId = 1;

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(data: { name: string; email: string }): User {
    const user: User = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
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

// --- User Controller & Pack ---

function userControllerTs(): string {
  return `import { Controller, Http, Body, Param, Status } from "@ambrosia-unce/http";
import { NotFoundException } from "@ambrosia-unce/http";
import { assert } from "@ambrosia-unce/validator";
import { CommandBus } from "../../shared/cqrs/command-bus";
import { QueryBus } from "../../shared/cqrs/query-bus";
import { CreateUserCommand } from "./commands/create-user.command";
import { DeleteUserCommand } from "./commands/delete-user.command";
import { GetUserQuery } from "./queries/get-user.query";
import { ListUsersQuery } from "./queries/list-users.query";
import type { User } from "./models/user.model";

@Controller("/users")
export class UserController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Http.Get("/")
  async findAll() {
    const users = await this.queryBus.execute<User[]>(new ListUsersQuery());
    return { data: users, count: users.length };
  }

  @Http.Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.queryBus.execute<User | undefined>(new GetUserQuery(Number(id)));
    if (!user) throw new NotFoundException(\`User #\${id} not found\`);
    return { data: user };
  }

  @Http.Post("/")
  @Status(201)
  async create(@Body() body: unknown) {
    const dto = assert<{ name: string; email: string }>(body);
    const user = await this.commandBus.execute<User>(new CreateUserCommand(dto.name, dto.email));
    return { data: user };
  }

  @Http.Delete("/:id")
  async remove(@Param("id") id: string) {
    const deleted = await this.commandBus.execute<boolean>(new DeleteUserCommand(Number(id)));
    if (!deleted) throw new NotFoundException(\`User #\${id} not found\`);
    return { message: \`User #\${id} deleted\` };
  }
}
`;
}

function userPackTs(): string {
  return `import type { HttpPackDefinition } from "@ambrosia-unce/http";
import type { OnInit } from "@ambrosia-unce/core";
import { UserController } from "./user.controller";
import { UserStore } from "./user.store";
import { CreateUserHandler } from "./commands/handlers/create-user.handler";
import { DeleteUserHandler } from "./commands/handlers/delete-user.handler";
import { GetUserHandler } from "./queries/handlers/get-user.handler";
import { ListUsersHandler } from "./queries/handlers/list-users.handler";
import { CommandBus } from "../../shared/cqrs/command-bus";
import { QueryBus } from "../../shared/cqrs/query-bus";

export const UserPack: HttpPackDefinition = {
  controllers: [UserController],
  providers: [
    UserStore,
    CreateUserHandler,
    DeleteUserHandler,
    GetUserHandler,
    ListUsersHandler,
  ],
  imports: [],
  onInit: async (container) => {
    const commandBus = container.resolve(CommandBus);
    const queryBus = container.resolve(QueryBus);

    // Register command handlers
    commandBus.register("CreateUser", container.resolve(CreateUserHandler));
    commandBus.register("DeleteUser", container.resolve(DeleteUserHandler));

    // Register query handlers
    queryBus.register("GetUser", container.resolve(GetUserHandler));
    queryBus.register("ListUsers", container.resolve(ListUsersHandler));
  },
};
`;
}

// --- Root ---

function appPackTs(): string {
  return `import type { PackDefinition } from "@ambrosia-unce/core";
import { SharedPack } from "./shared/shared.pack";
import { HealthPack } from "./modules/health/health.pack";
import { UserPack } from "./modules/user/user.pack";

export const AppPack: PackDefinition = {
  imports: [SharedPack, HealthPack, UserPack],
};
`;
}

function mainTs(): string {
  return `import "reflect-metadata";
import { HttpApplication } from "@ambrosia-unce/http";
import { ElysiaProvider } from "@ambrosia-unce/http-elysia";
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
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Guard, ExecutionContext } from "@ambrosia-unce/http";
import { UnauthorizedException } from "@ambrosia-unce/http";

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
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Interceptor, ExecutionContext, CallHandler } from "@ambrosia-unce/http";

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
  return `import { Injectable } from "@ambrosia-unce/core";
import type { ExceptionFilter, ExceptionFilterArgs } from "@ambrosia-unce/http";
import { HttpException } from "@ambrosia-unce/http";

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
  return `import { Injectable } from "@ambrosia-unce/core";
import type { Middleware, IHttpRequest, IHttpResponse } from "@ambrosia-unce/http";

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

  it("should create a user via command bus", async () => {
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
