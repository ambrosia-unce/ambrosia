/**
 * HttpApplication - Main application class
 *
 * Unified bootstrap for HTTP applications with automatic controller registration
 */

import {
  type Constructor,
  Container,
  type PackLifecycleManager,
  PackProcessor,
  Scope,
} from "@ambrosia/core";
import { ExecutionContextImpl } from "../context/execution-context.ts";
import { HttpContext } from "../context/http-context.ts";
import { ForbiddenException, RequestTimeoutException } from "../exceptions/built-in-exceptions.ts";
import { DefaultExceptionFilter } from "../filters/default-exception-filter.ts";
import type { ExceptionFilter } from "../filters/exception-filter.interface.ts";
import type { Guard } from "../guards/guard.interface.ts";
import type { Interceptor } from "../interceptors/interceptor.interface.ts";
import { ControllerRegistry, HttpMetadataManager } from "../metadata/http-metadata-manager.ts";
import type { Middleware, MiddlewareType } from "../middleware/middleware.interface.ts";
import type { Pipe } from "../pipes/pipe.interface.ts";
import type { HttpProvider } from "../providers/http-provider.interface.ts";
import { RouteCollector } from "../routing/route-collector.ts";
import type { RouteMetadata } from "../routing/route-metadata.ts";
import { SseStream } from "../sse/sse-stream.ts";
import type { HttpPackDefinition } from "../types/common.ts";
import { type ParameterMetadata, ParameterType } from "../types/metadata.ts";
import { LifecycleExecutor } from "./lifecycle-executor.ts";

/**
 * HttpApplication options
 */
export interface HttpApplicationOptions<TProvider extends HttpProvider = any> {
  /**
   * HTTP provider (required) - only one provider allowed
   */
  provider: new () => TProvider;

  /**
   * Existing DI container (optional)
   */
  container?: Container;

  /**
   * Explicit list of controller classes to register.
   * Used in addition to controllers from packs.
   */
  controllers?: Constructor[];

  /**
   * Packs to load. Each pack contributes providers.
   * Use HttpPackDefinition to also include controllers.
   * Supports falsy values for conditional loading.
   */
  packs?: (HttpPackDefinition | null | undefined | false)[];

  /**
   * Exclude specific controllers from registration
   */
  excludeControllers?: Constructor[];

  /**
   * Global middleware (executed first).
   * Supports both class-based and functional middleware.
   */
  globalMiddleware?: MiddlewareType[];

  /**
   * Global guards
   */
  globalGuards?: Constructor<Guard>[];

  /**
   * Global interceptors
   */
  globalInterceptors?: Constructor<Interceptor>[];

  /**
   * Global pipes
   */
  globalPipes?: Constructor<Pipe>[];

  /**
   * Global exception filters
   */
  globalFilters?: Constructor<ExceptionFilter>[];

  /**
   * Default port to listen on
   */
  port?: number;

  /**
   * Global prefix for all routes
   */
  prefix?: string;
}

/**
 * HttpApplication - Main application class
 *
 * Features:
 * - Automatic controller registration from ControllerRegistry
 * - Full lifecycle pipeline (Middleware → Guards → Interceptors → Pipes → Handler → Filters)
 * - REQUEST scope support with AsyncLocalStorage
 * - Performance optimizations (handler pre-compilation, caching)
 */
export class HttpApplication<TProvider extends HttpProvider = any> {
  private provider: TProvider;
  private container: Container;
  private lifecycleExecutor: LifecycleExecutor;
  private packLifecycleManager?: PackLifecycleManager;
  private options: HttpApplicationOptions<TProvider>;

  private constructor(options: HttpApplicationOptions<TProvider>) {
    this.options = options;
    this.container = options.container || new Container();
    this.provider = new options.provider();
    this.lifecycleExecutor = new LifecycleExecutor(this.container);

    // Register default global exception filter if none provided
    if (!options.globalFilters || options.globalFilters.length === 0) {
      this.options.globalFilters = [DefaultExceptionFilter];
    }
  }

  /**
   * Create HTTP application
   */
  static async create<T extends HttpProvider = any>(
    options: HttpApplicationOptions<T>,
  ): Promise<HttpApplication<T>> {
    const app = new HttpApplication(options);
    await app.initialize();
    return app;
  }

  /**
   * Initialize application
   *
   * 1. Process packs (extract providers + controllers)
   * 2. Merge controllers from all sources
   * 3. Register controllers in DI
   * 4. Collect routes
   * 5. Register routes with provider
   */
  private async initialize(): Promise<void> {
    // 1. Process packs (DI providers via core PackProcessor)
    const packControllers: Constructor[] = [];
    const validPacks = (this.options.packs || []).filter((p): p is HttpPackDefinition => !!p);

    if (validPacks.length > 0) {
      const processor = new PackProcessor();
      const result = processor.process(validPacks);
      PackProcessor.registerInContainer(this.container, result.providers);

      // Store lifecycle manager and execute onInit hooks
      this.packLifecycleManager = processor.getLifecycleManager();
      await this.packLifecycleManager.executeInit(this.container);

      // Extract controllers from HttpPackDefinition (HTTP-level concern)
      for (const pack of validPacks) {
        if (pack.controllers) {
          for (const ctrl of pack.controllers) {
            if (!packControllers.includes(ctrl)) {
              packControllers.push(ctrl);
            }
          }
        }
      }
    }

    // 2. Merge controllers: packs + explicit + ControllerRegistry (backward compat)
    const controllerSet = new Set<Constructor>([
      ...packControllers,
      ...(this.options.controllers || []),
      ...ControllerRegistry.getAll(),
    ]);

    // 3. Filter out excluded controllers
    const controllers = this.options.excludeControllers
      ? [...controllerSet].filter((c) => !this.options.excludeControllers!.includes(c))
      : [...controllerSet];

    // 4. Register controllers in DI if not already registered
    for (const controller of controllers) {
      if (!this.container.has(controller)) {
        const metadata = HttpMetadataManager.getController(controller);
        const scope = metadata?.scope || Scope.SINGLETON;
        this.container.registerClass(controller, controller, scope);
      }
    }

    // 5. Collect routes from controllers
    const routes: RouteMetadata[] = [];
    for (const controller of controllers) {
      const controllerRoutes = RouteCollector.collectFromController(controller);
      routes.push(...controllerRoutes);
    }

    // 6. Register routes with provider
    for (const route of routes) {
      const handler = this.createRouteHandler(route);

      const fullPath = this.options.prefix ? `${this.options.prefix}${route.path}` : route.path;

      this.provider.registerRoute({
        method: route.method,
        path: fullPath,
        handler,
      });
    }

    console.log(
      `[Ambrosia] Registered ${routes.length} routes from ${controllers.length} controllers`,
    );
  }

  /**
   * Create route handler with full lifecycle pipeline
   *
   * PERFORMANCE: Pre-compiles lifecycle metadata once during initialization
   */
  private createRouteHandler(route: RouteMetadata): (ctx: any) => Promise<any> {
    // Precompile lifecycle metadata
    const controllerMetadata = HttpMetadataManager.getController(route.controllerClass);
    const routeMethodMetadata = HttpMetadataManager.getRouteMethod(
      route.controllerClass,
      route.methodName,
    );

    // Merge global, controller, and method lifecycle components
    const middleware = [
      ...(this.options.globalMiddleware || []),
      ...(HttpMetadataManager.getMiddleware(route.controllerClass) || []),
      ...(HttpMetadataManager.getMiddleware(route.controllerClass, route.methodName) || []),
    ];

    const guards = [
      ...(this.options.globalGuards || []),
      ...(HttpMetadataManager.getGuards(route.controllerClass) || []),
      ...(HttpMetadataManager.getGuards(route.controllerClass, route.methodName) || []),
    ];

    const interceptors = [
      ...(this.options.globalInterceptors || []),
      ...(HttpMetadataManager.getInterceptors(route.controllerClass) || []),
      ...(HttpMetadataManager.getInterceptors(route.controllerClass, route.methodName) || []),
    ];

    const pipes = [
      ...(this.options.globalPipes || []),
      ...(HttpMetadataManager.getPipes(route.controllerClass) || []),
      ...(HttpMetadataManager.getPipes(route.controllerClass, route.methodName) || []),
    ];

    const filters = [
      ...(this.options.globalFilters || []),
      ...(HttpMetadataManager.getFilters(route.controllerClass) || []),
      ...(HttpMetadataManager.getFilters(route.controllerClass, route.methodName) || []),
    ];

    // Precompile parameter resolver
    const parameters = HttpMetadataManager.getParameters(route.controllerClass, route.methodName);
    const parameterResolver = this.compileParameterResolver(parameters, pipes);

    // Get response metadata
    const responseStatus = HttpMetadataManager.getResponseStatus(
      route.controllerClass,
      route.methodName,
    );
    const responseHeaders = HttpMetadataManager.getResponseHeaders(
      route.controllerClass,
      route.methodName,
    );

    // Get redirect metadata
    const redirect = HttpMetadataManager.getRedirect(route.controllerClass, route.methodName);

    // Get SSE flag
    const isSse = HttpMetadataManager.isSse(route.controllerClass, route.methodName);

    // Get timeout
    const timeout = HttpMetadataManager.getTimeout(route.controllerClass, route.methodName);

    // Pre-compile custom metadata (class-level + method-level merged)
    const classCustomMeta = HttpMetadataManager.getAllCustomMetadata(
      route.controllerClass,
      undefined,
    );
    const methodCustomMeta = HttpMetadataManager.getAllCustomMetadata(
      route.controllerClass,
      route.methodName,
    );
    const mergedCustomMeta = { ...classCustomMeta, ...methodCustomMeta };
    const hasCustomMeta = Object.keys(mergedCustomMeta).length > 0;

    // Return optimized handler
    return async (nativeCtx: any) => {
      try {
        // Adapt native context to HttpContext (temporary simplified version)
        const httpContext = nativeCtx as HttpContext;

        // Execute in REQUEST scope
        return await this.container.requestStorage.runAsync(async () => {
          // Store HttpContext in REQUEST scope for injection
          this.container.requestStorage.set(HttpContext, httpContext);

          // Create ExecutionContext
          const executionContext = new ExecutionContextImpl(
            httpContext,
            route.controllerClass,
            route.methodName,
            [],
          );

          // Inject pre-compiled custom metadata into ExecutionContext
          if (hasCustomMeta) {
            for (const [key, value] of Object.entries(mergedCustomMeta)) {
              executionContext.setMetadata(key, value);
            }
          }

          // Build the lifecycle execution
          const executeLifecycle = async () => {
            // 1. Execute middleware
            if (middleware.length > 0) {
              await this.lifecycleExecutor.executeMiddleware(middleware, executionContext);
            }

            // 2. Execute guards
            if (guards.length > 0) {
              const canActivate = await this.lifecycleExecutor.executeGuards(
                guards,
                executionContext,
              );
              if (!canActivate) {
                throw new ForbiddenException("Access denied");
              }
            }

            // 3. Execute interceptors + handler
            const result = await this.lifecycleExecutor.executeInterceptors(
              interceptors,
              executionContext,
              async () => {
                // Resolve controller
                const controller = this.container.resolve(route.controllerClass);

                // Resolve and transform parameters
                const args = await parameterResolver(httpContext);

                // Update execution context args
                (executionContext as any).args = args;

                // Invoke handler
                const handlerResult = await route.handler.apply(controller, args);

                // Apply response metadata (@Header, @Status)
                if (responseStatus) {
                  httpContext.response.setStatus(responseStatus);
                }
                if (responseHeaders) {
                  for (const [name, value] of Object.entries(responseHeaders)) {
                    httpContext.response.setHeader(name, value);
                  }
                }

                // Handle @Redirect
                if (redirect) {
                  const redirectUrl =
                    typeof handlerResult === "string" ? handlerResult : redirect.url;
                  httpContext.response.redirect(redirectUrl, redirect.statusCode);
                  return null;
                }

                // Handle @Sse — return a full Response so providers (Elysia) handle it correctly
                if (isSse && handlerResult instanceof SseStream) {
                  return new Response(handlerResult.stream, {
                    headers: {
                      "Content-Type": "text/event-stream",
                      "Cache-Control": "no-cache",
                      "Connection": "keep-alive",
                      "X-Accel-Buffering": "no",
                    },
                  });
                }

                return handlerResult;
              },
            );

            return result;
          };

          // Apply @Timeout wrapping
          if (timeout) {
            // timerId must be initialized before Promise.race to avoid
            // clearing an undefined timer if the lifecycle rejects synchronously
            let timerId: ReturnType<typeof setTimeout> | undefined;
            try {
              const timeoutPromise = new Promise<never>((_, reject) => {
                timerId = setTimeout(() => {
                  reject(new RequestTimeoutException(`Handler timed out after ${timeout}ms`));
                }, timeout);
              });
              const result = await Promise.race([executeLifecycle(), timeoutPromise]);
              return result;
            } finally {
              if (timerId !== undefined) {
                clearTimeout(timerId);
              }
            }
          }

          return await executeLifecycle();
        });
      } catch (error) {
        // Execute exception filters with fallback — if filters themselves throw,
        // use DefaultExceptionFilter to prevent unhandled crashes
        const httpContext = nativeCtx as HttpContext;
        const executionContext = new ExecutionContextImpl(
          httpContext,
          route.controllerClass,
          route.methodName,
          [],
        );

        try {
          return await this.lifecycleExecutor.executeFilters(filters, error, executionContext);
        } catch (filterError) {
          // Filters themselves threw — fall back to DefaultExceptionFilter
          const fallback = new DefaultExceptionFilter();
          return fallback.catch({ exception: filterError, httpContext });
        }
      }
    };
  }

  /**
   * Compile parameter resolver with pipes
   *
   * PERFORMANCE: Generates specialized function per route
   * Fixed array length for monomorphic JIT optimization
   */
  private compileParameterResolver(
    parameters: ParameterMetadata[],
    globalPipes: Constructor<Pipe>[],
  ): (ctx: HttpContext) => Promise<any[]> {
    if (parameters.length === 0) {
      return async () => [];
    }

    const sorted = [...parameters].sort((a, b) => a.parameterIndex - b.parameterIndex);

    return async (httpContext: HttpContext) => {
      const args = new Array(sorted.length);

      for (let i = 0; i < sorted.length; i++) {
        const param = sorted[i];
        let value: any;

        // Extract value based on parameter type
        switch (param.type) {
          case ParameterType.BODY:
            value = httpContext.body;
            break;
          case ParameterType.QUERY:
            value = param.propertyKey ? httpContext.query[param.propertyKey] : httpContext.query;
            break;
          case ParameterType.PARAM:
            value = param.propertyKey ? httpContext.params[param.propertyKey] : httpContext.params;
            break;
          case ParameterType.HEADERS:
            value = httpContext.headers;
            break;
          case ParameterType.HEADER:
            value = param.propertyKey ? httpContext.headers[param.propertyKey] : undefined;
            break;
          case ParameterType.REQUEST:
            value = httpContext.request;
            break;
          case ParameterType.RESPONSE:
            value = httpContext.response;
            break;
          case ParameterType.CONTEXT:
            value = httpContext.native;
            break;
          case ParameterType.SESSION:
            value = httpContext.request.session;
            break;
          case ParameterType.COOKIE:
            value = param.propertyKey
              ? httpContext.request.cookies?.[param.propertyKey]
              : httpContext.request.cookies;
            break;
          case ParameterType.IP:
            value = httpContext.request.ip;
            break;
          case ParameterType.UPLOADED_FILE:
            value = httpContext.request.files?.find((f) => f.fieldname === param.propertyKey);
            break;
          case ParameterType.UPLOADED_FILES:
            value = param.propertyKey
              ? httpContext.request.files?.filter((f) => f.fieldname === param.propertyKey) || []
              : httpContext.request.files || [];
            break;
          default:
            value = undefined;
        }

        // Apply pipes (global → controller → method → parameter-specific)
        const pipes = [...globalPipes, ...(param.pipes || [])];
        if (pipes.length > 0) {
          value = await this.lifecycleExecutor.executePipes(pipes, value, { type: param.type });
        }

        args[i] = value;
      }

      return args;
    };
  }

  /**
   * Start listening on port
   */
  async listen(port?: number): Promise<void> {
    const listenPort = port || this.options.port || 3000;
    await this.provider.listen(listenPort);
    console.log(`🚀 Ambrosia HTTP Server running on http://localhost:${listenPort}`);
  }

  /**
   * Gracefully shutdown the application.
   * Executes pack onDestroy hooks in reverse order.
   */
  async close(): Promise<void> {
    await this.provider.close?.();
    if (this.packLifecycleManager) {
      await this.packLifecycleManager.executeDestroy();
    }
    await this.container.destroyAll();
  }

  /**
   * Get native provider app
   */
  getNativeApp(): any {
    return this.provider.getNativeApp();
  }

  /**
   * Get DI container
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Get HTTP provider
   */
  getProvider(): TProvider {
    return this.provider;
  }
}
