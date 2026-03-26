import { defineConfig } from "@ambrosia-unce/config";

/**
 * Application configuration schema.
 *
 * All environment variables are parsed once at startup
 * and available via ConfigService throughout the app.
 */
export const AppConfig = defineConfig({
  port: { env: "PORT", type: "int", default: 3000 },
  appName: { env: "APP_NAME", type: "string", default: "Ambrosia Example API" },
  logLevel: { env: "LOG_LEVEL", type: "string", default: "debug" },
  authEnabled: { env: "AUTH_ENABLED", type: "bool", default: true },
});
