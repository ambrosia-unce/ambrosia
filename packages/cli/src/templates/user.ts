export function userEntity(): string {
  return `export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
`;
}

export function createUserDto(): string {
  return `export interface CreateUserDto {
  name: string;
  email: string;
}
`;
}

export function updateUserDto(): string {
  return `export interface UpdateUserDto {
  name?: string;
  email?: string;
}
`;
}

export function userService(): string {
  return `import { Injectable } from "@ambrosia-unce/core";
import type { User } from "./entities/user.entity";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  private users: User[] = [];
  private nextId = 1;

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(dto: CreateUserDto): User {
    const user: User = {
      id: this.nextId++,
      name: dto.name,
      email: dto.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  update(id: number, dto: UpdateUserDto): User | undefined {
    const user = this.findOne(id);
    if (!user) return undefined;

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    user.updatedAt = new Date();

    return user;
  }

  remove(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
`;
}

export function userController(): string {
  return `import { Controller, Http, Body, Param, Status } from "@ambrosia-unce/http";
import { NotFoundException, BadRequestException } from "@ambrosia-unce/http";
import { UserService } from "./user.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

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
  create(@Body() body: any) {
    if (!body?.name || !body?.email) {
      throw new BadRequestException("name and email are required");
    }
    const user = this.userService.create(body as CreateUserDto);
    return { data: user };
  }

  @Http.Put("/:id")
  update(@Param("id") id: string, @Body() body: any) {
    const user = this.userService.update(Number(id), body as UpdateUserDto);
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
