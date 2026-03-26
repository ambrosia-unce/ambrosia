import type { HttpPackDefinition } from "@ambrosia-unce/http";
import { UserController } from "./user.controller.ts";
import { UserService } from "./user.service.ts";

/**
 * User feature pack — encapsulates user-related providers and controllers.
 *
 * Exports UserService so other packs (e.g., tasks) can look up users.
 */
export const UserPack: HttpPackDefinition = {
  meta: { name: "users" },
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
};
