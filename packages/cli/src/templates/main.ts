export function mainTs(): string {
  return `import "reflect-metadata";
import { HttpApplication } from "@ambrosia/http";
import { ElysiaProvider } from "@ambrosia/http-elysia";
import { HealthPack } from "./modules/health/health.pack";
import { UserPack } from "./modules/user/user.pack";

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;

  const app = await HttpApplication.create({
    provider: ElysiaProvider,
    prefix: "/api",
    port,
    packs: [HealthPack, UserPack],
  });

  await app.listen();
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
`;
}
