/**
 * PackCollector — collects pack tree info from the container
 * and global pack registry for DevTools introspection.
 */

import {
  type Container,
  Inject,
  Injectable,
  type LoadedPackInfo,
  tokenToString,
} from "@ambrosia-unce/core";
import type { HttpPackDefinition } from "@ambrosia-unce/http";
import type { PackInfo, PackTreeData, ProviderInfo } from "../types.ts";

@Injectable()
export class PackCollector {
  /**
   * Collect the full pack tree from the container.
   *
   * Uses container.getLoadedPacks() which reads from the global PackRegistry.
   */
  collectPackTree(container: Container): PackTreeData {
    const loadedPacks = container.getLoadedPacks();
    const packs: PackInfo[] = [];
    let totalProviders = 0;

    for (const info of loadedPacks) {
      const packInfo = this.mapPackInfo(info);
      packs.push(packInfo);
      totalProviders += packInfo.providers.length;
    }

    return {
      packs,
      totalProviders,
      totalPacks: packs.length,
    };
  }

  private mapPackInfo(info: LoadedPackInfo): PackInfo {
    const pack = info.pack;
    const providers: ProviderInfo[] = [];

    if (pack.providers) {
      for (const provider of pack.providers) {
        if (typeof provider === "function") {
          // Bare constructor shorthand
          providers.push({
            token: provider.name,
            scope: "SINGLETON",
            type: "class",
          });
        } else {
          const tokenName = tokenToString(provider.token);
          let type = "unknown";
          let scope = "SINGLETON";

          if ("useClass" in provider) {
            type = "class";
            scope = (provider as any).scope ?? "SINGLETON";
          } else if ("useValue" in provider) {
            type = "value";
            scope = "N/A";
          } else if ("useFactory" in provider) {
            type = "factory";
            scope = (provider as any).scope ?? "SINGLETON";
          } else if ("useExisting" in provider) {
            type = "existing";
            scope = "N/A";
          }

          if (typeof scope !== "string") {
            scope = String(scope);
          }

          providers.push({ token: tokenName, scope, type });
        }
      }
    }

    const exports: string[] = [];
    if (pack.exports) {
      for (const token of pack.exports) {
        exports.push(tokenToString(token));
      }
    }

    const imports: string[] = [];
    if (pack.imports) {
      for (const imp of pack.imports) {
        if (imp) {
          imports.push(imp.meta?.name ?? "anonymous");
        }
      }
    }

    // Extract controllers from HttpPackDefinition
    const controllers: string[] = [];
    const httpPack = pack as HttpPackDefinition;
    if (httpPack.controllers) {
      for (const ctrl of httpPack.controllers) {
        controllers.push(ctrl.name);
      }
    }

    return {
      name: info.metadata.name,
      providers,
      exports,
      imports,
      controllers,
      hasOnInit: typeof pack.onInit === "function",
      hasOnDestroy: typeof pack.onDestroy === "function",
    };
  }
}
