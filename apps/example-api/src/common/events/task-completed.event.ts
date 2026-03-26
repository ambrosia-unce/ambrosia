import type { Task } from "../../tasks/task.entity.ts";

/**
 * Emitted when a task is marked as completed.
 */
export class TaskCompletedEvent {
  constructor(public readonly task: Task) {}
}
