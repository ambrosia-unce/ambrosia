/**
 * Pack source file templates — generates source files for code-distribution packs.
 * Used by `ambrosia generate pack` and registry builds.
 */

export function packIndex(name: string, pascalName: string): string {
  return `export { ${pascalName}Pack } from "./${name}.pack";
export { ${pascalName}Service } from "./${name}.service";
export type { ${pascalName}Config } from "./types";
export { ${name.toUpperCase().replace(/-/g, "_")}_CONFIG } from "./types";
`;
}

export function packDefinition(name: string, pascalName: string): string {
  const configToken = `${name.toUpperCase().replace(/-/g, "_")}_CONFIG`;

  return `import type { PackDefinition, AsyncPackOptions } from "@ambrosia-unce/core";
import { createAsyncProvider } from "@ambrosia-unce/core";
import { ${pascalName}Service } from "./${name}.service";
import type { ${pascalName}Config } from "./types";
import { ${configToken} } from "./types";

export class ${pascalName}Pack {
  static forRoot(config: ${pascalName}Config): PackDefinition {
    return {
      meta: { name: "${name}", version: "0.0.1" },
      providers: [
        { token: ${configToken}, useValue: config },
        ${pascalName}Service,
      ],
      exports: [${pascalName}Service],
    };
  }

  static forRootAsync(options: AsyncPackOptions<${pascalName}Config>): PackDefinition {
    return {
      meta: { name: "${name}-async" },
      providers: [
        createAsyncProvider(${configToken}, options),
        ${pascalName}Service,
      ],
      exports: [${pascalName}Service],
    };
  }
}
`;
}

export function packService(name: string, pascalName: string): string {
  const configToken = `${name.toUpperCase().replace(/-/g, "_")}_CONFIG`;

  return `import { Injectable, Inject } from "@ambrosia-unce/core";
import type { ${pascalName}Config } from "./types";
import { ${configToken} } from "./types";

@Injectable()
export class ${pascalName}Service {
  constructor(@Inject(${configToken}) private config: ${pascalName}Config) {}

  getConfig(): ${pascalName}Config {
    return this.config;
  }
}
`;
}

export function packTypes(pascalName: string, name: string): string {
  const configToken = `${name.toUpperCase().replace(/-/g, "_")}_CONFIG`;

  return `import { InjectionToken } from "@ambrosia-unce/core";

export interface ${pascalName}Config {
  // Define your pack configuration here
  enabled: boolean;
}

export const ${configToken} = new InjectionToken<${pascalName}Config>("${pascalName}Config");
`;
}
