/**
 * OpenAPI 3.0 specification generator
 */

import "reflect-metadata";
import type { Constructor } from "@ambrosia-unce/core";
import { HTTP_METADATA_KEYS } from "../metadata/constants.ts";
import { HttpMetadataManager } from "../metadata/http-metadata-manager.ts";
import type { ApiPropertyOptions, ApiResponseOptions } from "./decorators.ts";

/**
 * OpenAPI 3.0 spec (subset)
 */
export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, any>;
  components?: { schemas?: Record<string, any> };
  tags?: Array<{ name: string; description?: string }>;
}

export interface OpenApiGeneratorOptions {
  title: string;
  version: string;
  description?: string;
  prefix?: string;
}

/**
 * OpenApiGenerator
 *
 * Reads controller metadata, route metadata, parameter decorators,
 * and API decorators to produce an OpenAPI 3.0 JSON specification.
 *
 * @example
 * ```typescript
 * const spec = OpenApiGenerator.generate({
 *   title: 'My API',
 *   version: '1.0.0',
 *   description: 'REST API documentation',
 *   prefix: '/api',
 * });
 *
 * // Serve as JSON endpoint
 * @Controller('/docs')
 * class DocsController {
 *   @Get('/openapi.json')
 *   getSpec() { return spec; }
 * }
 * ```
 */
export class OpenApiGenerator {
  static generate(options: OpenApiGeneratorOptions): OpenApiSpec {
    const controllers = HttpMetadataManager.getAllControllers();
    const spec: OpenApiSpec = {
      openapi: "3.0.0",
      info: {
        title: options.title,
        version: options.version,
        description: options.description,
      },
      paths: {},
      components: { schemas: {} },
      tags: [],
    };

    for (const controller of controllers) {
      const controllerMeta = HttpMetadataManager.getController(controller);
      if (!controllerMeta) continue;

      const tags: string[] = Reflect.getMetadata(HTTP_METADATA_KEYS.API_TAGS, controller) || [];

      for (const tag of tags) {
        if (!spec.tags!.find((t) => t.name === tag)) {
          spec.tags!.push({ name: tag });
        }
      }

      const routeMethods = HttpMetadataManager.getRouteMethods(controller);

      for (const route of routeMethods) {
        for (const controllerPath of controllerMeta.path) {
          for (const methodPath of route.path) {
            const fullPath = OpenApiGenerator.joinPaths(
              options.prefix || "",
              controllerPath,
              methodPath,
            );
            const openApiPath = OpenApiGenerator.toOpenApiPath(fullPath);

            if (!spec.paths[openApiPath]) {
              spec.paths[openApiPath] = {};
            }

            const method = route.method.toLowerCase();
            const responses: ApiResponseOptions[] =
              Reflect.getMetadata(HTTP_METADATA_KEYS.API_RESPONSE, controller, route.methodName) ||
              [];

            const parameters = HttpMetadataManager.getParameters(controller, route.methodName);

            const operation: Record<string, any> = {
              operationId: `${controller.name}_${String(route.methodName)}`,
              parameters: OpenApiGenerator.buildParameters(parameters),
              responses: OpenApiGenerator.buildResponses(responses),
            };

            if (tags.length > 0) {
              operation.tags = tags;
            }

            // Add request body for POST/PUT/PATCH
            const bodyParam = parameters.find((p) => p.type === "BODY");
            if (bodyParam && ["POST", "PUT", "PATCH"].includes(route.method)) {
              // Try to get DTO type from design:paramtypes metadata
              const paramTypes: Function[] | undefined = Reflect.getMetadata(
                "design:paramtypes",
                controller.prototype,
                route.methodName,
              );
              const bodyType = paramTypes?.[bodyParam.parameterIndex];
              const bodySchema = bodyType
                ? OpenApiGenerator.typeToSchema(bodyType)
                : { type: "object" };

              operation.requestBody = {
                content: {
                  "application/json": { schema: bodySchema },
                },
              };
            }

            spec.paths[openApiPath][method] = operation;
          }
        }
      }
    }

    return spec;
  }

  private static joinPaths(...parts: string[]): string {
    return (
      "/" +
      parts
        .map((p) => p.replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
        .join("/")
    );
  }

  private static toOpenApiPath(path: string): string {
    return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");
  }

  private static buildParameters(params: any[]): any[] {
    return params
      .filter((p) => ["PARAM", "QUERY", "HEADER"].includes(p.type))
      .map((p) => ({
        name: p.propertyKey || "unknown",
        in: p.type === "PARAM" ? "path" : p.type === "QUERY" ? "query" : "header",
        required: p.type === "PARAM",
        schema: { type: "string" },
      }));
  }

  private static buildResponses(responses: ApiResponseOptions[]): Record<string, any> {
    if (responses.length === 0) {
      return { "200": { description: "Success" } };
    }
    const result: Record<string, any> = {};
    for (const r of responses) {
      const entry: Record<string, any> = { description: r.description };

      if (r.type) {
        let schema = OpenApiGenerator.typeToSchema(r.type);
        if (r.isArray) {
          schema = { type: "array", items: schema };
        }
        entry.content = {
          "application/json": { schema },
        };
      }

      result[String(r.status)] = entry;
    }
    return result;
  }

  /**
   * Convert a class or primitive constructor to an OpenAPI schema.
   * Reads @ApiProperty metadata from DTO classes.
   */
  private static typeToSchema(type: Function): Record<string, any> {
    // Primitive types
    if (type === String) return { type: "string" };
    if (type === Number) return { type: "number" };
    if (type === Boolean) return { type: "boolean" };

    // DTO class — read @ApiProperty metadata
    const properties: Record<string, ApiPropertyOptions> | undefined = Reflect.getMetadata(
      HTTP_METADATA_KEYS.API_PROPERTY,
      type,
    );

    if (!properties || Object.keys(properties).length === 0) {
      return { type: "object" };
    }

    const schema: Record<string, any> = {
      type: "object",
      properties: {},
    };
    const required: string[] = [];

    for (const [key, opts] of Object.entries(properties)) {
      const prop: Record<string, any> = {};

      if (opts.type) {
        if (typeof opts.type === "function") {
          Object.assign(prop, OpenApiGenerator.typeToSchema(opts.type));
        } else {
          prop.type = opts.type;
        }
      } else {
        prop.type = "string";
      }

      if (opts.description) prop.description = opts.description;
      if (opts.example !== undefined) prop.example = opts.example;
      if (opts.enum) prop.enum = opts.enum;
      if (opts.format) prop.format = opts.format;
      if (opts.default !== undefined) prop.default = opts.default;
      if (opts.nullable) prop.nullable = true;

      schema.properties[key] = prop;

      if (opts.required !== false) {
        required.push(key);
      }
    }

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }
}
