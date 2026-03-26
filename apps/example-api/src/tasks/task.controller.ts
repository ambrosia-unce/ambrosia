import { Controller, Http, Body, Param, Query, Status, UseGuard } from "@ambrosia-unce/http";
import { AuthGuard } from "../auth/auth.guard.ts";
import type { CreateTaskDto } from "./dto/create-task.dto.ts";
import type { UpdateTaskDto } from "./dto/update-task.dto.ts";
import type { TaskStatus } from "./task.entity.ts";
import { TaskService } from "./task.service.ts";

/**
 * Task controller — REST endpoints for task management.
 *
 * Read operations are public; write operations require authentication.
 */
@Controller("/tasks")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * POST /tasks — create a new task (auth required)
   */
  @Http.Post()
  @Status(201)
  @UseGuard(AuthGuard)
  create(@Body() body: CreateTaskDto) {
    return this.taskService.create(body);
  }

  /**
   * GET /tasks — list tasks, optionally filtered by status
   */
  @Http.Get()
  findAll(@Query("status") status?: TaskStatus) {
    return this.taskService.findAll(status as TaskStatus | undefined);
  }

  /**
   * GET /tasks/:id — get task by id
   */
  @Http.Get("/:id")
  findOne(@Param("id") id: string) {
    return this.taskService.findById(id);
  }

  /**
   * PATCH /tasks/:id — update a task (auth required)
   */
  @Http.Patch("/:id")
  @UseGuard(AuthGuard)
  update(@Param("id") id: string, @Body() body: UpdateTaskDto) {
    return this.taskService.update(id, body);
  }

  /**
   * DELETE /tasks/:id — delete a task (auth required)
   */
  @Http.Delete("/:id")
  @UseGuard(AuthGuard)
  remove(@Param("id") id: string) {
    this.taskService.remove(id);
    return { success: true };
  }

  /**
   * PATCH /tasks/:id/complete — mark a task as completed (auth required)
   *
   * Fires a TaskCompletedEvent handled by NotificationListener.
   */
  @Http.Patch("/:id/complete")
  @UseGuard(AuthGuard)
  complete(@Param("id") id: string) {
    return this.taskService.complete(id);
  }
}
