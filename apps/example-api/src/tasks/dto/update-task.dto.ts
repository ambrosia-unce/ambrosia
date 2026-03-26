import type { TaskStatus } from "../task.entity.ts";

/**
 * DTO for updating an existing task.
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
}
