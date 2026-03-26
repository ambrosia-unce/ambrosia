import type { User } from "../../users/user.entity.ts";

/**
 * Emitted when a new user is created.
 */
export class UserCreatedEvent {
  constructor(public readonly user: User) {}
}
