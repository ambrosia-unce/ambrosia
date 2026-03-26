import { Injectable } from "@ambrosia/core";
import { EventBus } from "@ambrosia/events";
import { NotFoundException } from "@ambrosia/http";
import { UserCreatedEvent } from "../common/events/user-created.event.ts";
import type { CreateUserDto } from "./dto/create-user.dto.ts";
import type { User } from "./user.entity.ts";

/**
 * User service — handles CRUD operations for users.
 *
 * Uses an in-memory Map as the data store for simplicity.
 */
@Injectable()
export class UserService {
  private readonly users = new Map<string, User>();
  private nextId = 1;

  constructor(private readonly eventBus: EventBus) {}

  create(dto: CreateUserDto): User {
    const id = String(this.nextId++);
    const user: User = {
      id,
      name: dto.name,
      email: dto.email,
      createdAt: new Date().toISOString(),
    };

    this.users.set(id, user);

    // Emit domain event
    this.eventBus.emit(new UserCreatedEvent(user));

    return user;
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  findById(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }
}
