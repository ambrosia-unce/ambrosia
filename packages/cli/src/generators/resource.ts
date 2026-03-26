/**
 * Resource generators — creates source files for Ambrosia framework resources.
 * Used by `ambrosia generate <type> <name>`.
 */

export type ResourceType =
  | "controller"
  | "service"
  | "guard"
  | "interceptor"
  | "pipe"
  | "filter"
  | "middleware"
  | "event"
  | "pack";

export const RESOURCE_TYPES: ResourceType[] = [
  "controller",
  "service",
  "guard",
  "interceptor",
  "pipe",
  "filter",
  "middleware",
  "event",
  "pack",
];

/** Convert kebab-case to PascalCase. */
export function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Get the plural form for route paths (simple heuristic). */
function toRoutePath(name: string): string {
  if (name.endsWith("s")) return `/${name}`;
  if (name.endsWith("y")) return `/${name.slice(0, -1)}ies`;
  return `/${name}s`;
}

/** Get the file suffix for a resource type. */
export function getFileSuffix(type: ResourceType): string {
  switch (type) {
    case "controller":
      return ".controller.ts";
    case "service":
      return ".service.ts";
    case "guard":
      return ".guard.ts";
    case "interceptor":
      return ".interceptor.ts";
    case "pipe":
      return ".pipe.ts";
    case "filter":
      return ".filter.ts";
    case "middleware":
      return ".middleware.ts";
    case "event":
      return ".event.ts";
    case "pack":
      return ".pack.ts";
  }
}

/** Generate source code for a controller. */
export function controllerTemplate(name: string): string {
  const pascal = toPascalCase(name);
  const route = toRoutePath(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import { Controller, Http } from "@ambrosia-unce/http";

@Controller("${route}")
class ${pascal}Controller {
  @Http.Get("/")
  findAll() {
    return [];
  }
}

export { ${pascal}Controller };
`;
}

/** Generate source code for a service. */
export function serviceTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";

@Injectable()
class ${pascal}Service {
  // TODO: implement
}

export { ${pascal}Service };
`;
}

/** Generate source code for a guard. */
export function guardTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import type { Guard, ExecutionContext } from "@ambrosia-unce/http";

@Injectable()
class ${pascal}Guard implements Guard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // TODO: implement
    return true;
  }
}

export { ${pascal}Guard };
`;
}

/** Generate source code for an interceptor. */
export function interceptorTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import type { Interceptor, ExecutionContext, CallHandler } from "@ambrosia-unce/http";

@Injectable()
class ${pascal}Interceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const start = performance.now();
    const result = await next.handle();
    console.log(\`\${context.getMethod()} \${context.getPath()} - \${(performance.now() - start).toFixed(1)}ms\`);
    return result;
  }
}

export { ${pascal}Interceptor };
`;
}

/** Generate source code for a pipe. */
export function pipeTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import type { Pipe, PipeTransform } from "@ambrosia-unce/http";

@Injectable()
class ${pascal}Pipe implements PipeTransform {
  transform(value: unknown) {
    // TODO: implement
    return value;
  }
}

export { ${pascal}Pipe };
`;
}

/** Generate source code for an exception filter. */
export function filterTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import type { ExceptionFilter, ExceptionFilterArgs } from "@ambrosia-unce/http";
import { HttpException } from "@ambrosia-unce/http";

@Injectable()
class ${pascal}Filter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs) {
    const { exception } = args;

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.getMessage(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode: 500,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    };
  }
}

export { ${pascal}Filter };
`;
}

/** Generate source code for a middleware. */
export function middlewareTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `import { Injectable } from "@ambrosia-unce/core";
import type { Middleware, IHttpRequest, IHttpResponse } from "@ambrosia-unce/http";

@Injectable()
class ${pascal}Middleware implements Middleware {
  async use(req: IHttpRequest, res: IHttpResponse, next: () => Promise<void>) {
    // TODO: implement
    await next();
  }
}

export { ${pascal}Middleware };
`;
}

/** Generate source code for an event class. */
export function eventTemplate(name: string): string {
  const pascal = toPascalCase(name);

  return `export class ${pascal}Event {
  constructor(
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
`;
}

/** Get the template function for a given resource type. */
export function getTemplate(type: ResourceType): (name: string) => string {
  switch (type) {
    case "controller":
      return controllerTemplate;
    case "service":
      return serviceTemplate;
    case "guard":
      return guardTemplate;
    case "interceptor":
      return interceptorTemplate;
    case "pipe":
      return pipeTemplate;
    case "filter":
      return filterTemplate;
    case "middleware":
      return middlewareTemplate;
    case "event":
      return eventTemplate;
    default:
      throw new Error(`No template for resource type: ${type}`);
  }
}
