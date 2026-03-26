import { definePack } from "@ambrosia/core";
import { AuthGuard } from "./auth.guard.ts";

/**
 * Auth pack — provides authentication guard.
 *
 * Exports AuthGuard so other packs can use @UseGuard(AuthGuard)
 * on their controllers and routes.
 */
export const AuthPack = definePack({
  meta: { name: "auth" },
  providers: [AuthGuard],
  exports: [AuthGuard],
});
