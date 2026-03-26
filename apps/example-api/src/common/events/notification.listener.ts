import { Injectable, LoggerService } from "@ambrosia-unce/core";
import { OnEvent } from "@ambrosia-unce/events";
import { TaskCompletedEvent } from "./task-completed.event.ts";
import { UserCreatedEvent } from "./user-created.event.ts";

/**
 * Listens for domain events and logs notifications.
 *
 * In a real application this would send emails, push notifications, etc.
 */
@Injectable()
export class NotificationListener {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.child("Notification");
  }

  @OnEvent(UserCreatedEvent)
  onUserCreated(event: UserCreatedEvent): void {
    this.logger.info(
      `Welcome email queued for ${event.user.name} <${event.user.email}>`,
    );
  }

  @OnEvent(TaskCompletedEvent)
  onTaskCompleted(event: TaskCompletedEvent): void {
    this.logger.info(
      `Task "${event.task.title}" completed (id: ${event.task.id})`,
    );
  }
}
