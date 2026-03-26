export function healthPack(): string {
  return `import type { HttpPackDefinition } from "@ambrosia-unce/http";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

export const HealthPack: HttpPackDefinition = {
  controllers: [HealthController],
  providers: [HealthService],
};
`;
}

export function userPack(): string {
  return `import type { HttpPackDefinition } from "@ambrosia-unce/http";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

export const UserPack: HttpPackDefinition = {
  controllers: [UserController],
  providers: [UserService],
};
`;
}
