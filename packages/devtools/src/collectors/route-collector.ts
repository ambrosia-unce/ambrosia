/**
 * DevToolsRouteCollector — collects registered route metadata
 * from HTTP controllers for DevTools introspection.
 *
 * Not to be confused with @ambrosia-unce/http's RouteCollector which
 * is used during application bootstrap. This collector reads
 * the same metadata but returns a DevTools-friendly format.
 */

import { Injectable, type Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager, RouteCollector } from "@ambrosia-unce/http";
import type { RouteInfo, RouteMapData, RouteParamInfo } from "../types.ts";

@Injectable()
export class DevToolsRouteCollector {
  /**
   * Collect all routes from registered controllers.
   */
  collectRoutes(): RouteMapData {
    const controllers = HttpMetadataManager.getAllControllers();
    const routes: RouteInfo[] = [];

    for (const controller of controllers) {
      const controllerRoutes = RouteCollector.collectFromController(controller);

      for (const route of controllerRoutes) {
        routes.push({
          method: route.method,
          path: route.path,
          controller: route.controllerClass.name,
          handler: String(route.methodName),
          guards: this.getNames(
            HttpMetadataManager.getGuards(route.controllerClass, route.methodName),
          ),
          interceptors: this.getNames(
            HttpMetadataManager.getInterceptors(route.controllerClass, route.methodName),
          ),
          pipes: this.getNames(
            HttpMetadataManager.getPipes(route.controllerClass, route.methodName),
          ),
          filters: this.getNames(
            HttpMetadataManager.getFilters(route.controllerClass, route.methodName),
          ),
          middleware: this.getNames(
            HttpMetadataManager.getMiddleware(route.controllerClass, route.methodName),
          ),
          params: route.parameters.map(
            (p): RouteParamInfo => ({
              type: String(p.type),
              name: p.propertyKey,
              index: p.parameterIndex,
            }),
          ),
        });
      }
    }

    return {
      routes,
      totalRoutes: routes.length,
    };
  }

  private getNames(items: Constructor[] | any[] | undefined): string[] {
    if (!items) return [];
    return items.map((item) => {
      if (typeof item === "function") return item.name;
      if (typeof item === "object" && item?.constructor) return item.constructor.name;
      return String(item);
    });
  }
}
