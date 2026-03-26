import { Injectable } from "@ambrosia/core";
import { EventBus } from "@ambrosia/events";
import { NotFoundException } from "@ambrosia/http";
import { TaskCompletedEvent } from "../common/events/task-completed.event.ts";
import type { CreateTaskDto } from "./dto/create-task.dto.ts";
import type { UpdateTaskDto } from "./dto/update-task.dto.ts";
import type { Task, TaskStatus } from "./task.entity.ts";

/**
 * Task service — handles CRUD operations for tasks.
 *
 * Uses an in-memory Map as the data store for simplicity.
 */
@Injectable()
export class TaskService {
  private readonly tasks = new Map<string, Task>();
  private nextId = 1;

  constructor(private readonly eventBus: EventBus) {}

  create(dto: CreateTaskDto): Task {
    const id = String(this.nextId++);
    const now = new Date().toISOString();

    const task: Task = {
      id,
      title: dto.title,
      description: dto.description ?? "",
      status: "pending",
      assigneeId: dto.assigneeId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return task;
  }

  findAll(status?: TaskStatus): Task[] {
    const all = Array.from(this.tasks.values());
    if (status) {
      return all.filter((t) => t.status === status);
    }
    return all;
  }

  findById(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }
    return task;
  }

  update(id: string, dto: UpdateTaskDto): Task {
    const task = this.findById(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId;
    task.updatedAt = new Date().toISOString();

    this.tasks.set(id, task);
    return task;
  }

  remove(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }
    this.tasks.delete(id);
  }

  complete(id: string): Task {
    const task = this.findById(id);
    task.status = "completed";
    task.updatedAt = new Date().toISOString();
    this.tasks.set(id, task);

    // Emit domain event
    this.eventBus.emit(new TaskCompletedEvent(task));

    return task;
  }
}
