import type { HttpPackDefinition } from "@ambrosia/http";
import { TaskController } from "./task.controller.ts";
import { TaskService } from "./task.service.ts";

/**
 * Task feature pack — encapsulates task-related providers and controllers.
 */
export const TaskPack: HttpPackDefinition = {
  meta: { name: "tasks" },
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
};
