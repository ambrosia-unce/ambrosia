/**
 * ConfigCollector — collects configuration values from
 * ConfigService for DevTools introspection.
 *
 * If @ambrosia-unce/config is not installed, returns empty data.
 */

import { Injectable, type Container } from "@ambrosia-unce/core";
import type { ConfigMapData, ConfigValueInfo } from "../types.ts";

@Injectable()
export class ConfigCollector {
  /**
   * Collect all config values from ConfigService (if available).
   */
  collectConfig(container: Container): ConfigMapData {
    const values: ConfigValueInfo[] = [];

    try {
      const configService = container.resolveOptional<any>(
        this.getConfigServiceToken(),
      );

      if (configService && typeof configService.getAll === "function") {
        const allValues: Record<string, unknown> = configService.getAll();

        for (const [key, value] of Object.entries(allValues)) {
          values.push({
            key,
            value: this.sanitizeValue(value),
            type: this.getValueType(value),
          });
        }
      }
    } catch {
      // ConfigService not available — return empty data
    }

    return {
      values,
      totalKeys: values.length,
    };
  }

  /**
   * Determine the type name of a config value.
   */
  private getValueType(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  /**
   * Sanitize sensitive values (mask strings that look like secrets).
   */
  private sanitizeValue(value: unknown): unknown {
    if (typeof value === "string" && value.length > 8) {
      const lower = value.toLowerCase();
      // Mask values whose keys or content look like secrets
      if (
        lower.includes("password") ||
        lower.includes("secret") ||
        lower.includes("token") ||
        lower.includes("api_key") ||
        lower.includes("apikey")
      ) {
        return `${value.slice(0, 3)}${"*".repeat(value.length - 3)}`;
      }
    }
    return value;
  }

  /**
   * Try to get the ConfigService class for resolution.
   */
  private getConfigServiceToken(): any {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require("@ambrosia-unce/config");
      return config.ConfigService;
    } catch {
      return class ConfigServicePlaceholder {};
    }
  }
}
