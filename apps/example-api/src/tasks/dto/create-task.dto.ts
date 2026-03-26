/**
 * DTO for creating a new task.
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
}
