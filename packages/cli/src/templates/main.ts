export function mainTs(): string {
  return `import "reflect-metadata";
import { HttpApplication } from "@ambrosia-unce/http";
import { ElysiaProvider } from "@ambrosia-unce/http-elysia";
import { ConfigModule, defineConfig } from "@ambrosia-unce/config";
import { EventBusModule } from "@ambrosia-unce/events";
import { HealthPack } from "./modules/health/health.pack";
import { UserPack } from "./modules/user/user.pack";

const AppConfig = defineConfig({
  port: { env: "PORT", type: "int", default: 3000 },
  appName: { env: "APP_NAME", type: "string", default: "ambrosia-app" },
  logLevel: { env: "LOG_LEVEL", type: "string", default: "info" },
});

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;

  const app = await HttpApplication.create({
    provider: ElysiaProvider,
    prefix: "/api",
    port,
    packs: [
      ConfigModule.forRoot({ schema: AppConfig }),
      EventBusModule.forRoot(),
      HealthPack,
      UserPack,
    ],
  });

  await app.listen();
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
`;
}
