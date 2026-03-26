/**
 * Task entity — represents a task in the system.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";
