import * as p from "@clack/prompts";
import { loadConfig } from "../config/ambrosia-config.ts";
import {
  type ResourceType,
  RESOURCE_TYPES,
  getFileSuffix,
  getTemplate,
  toPascalCase,
} from "../generators/resource.ts";
import { packDefinition, packIndex, packService, packTypes } from "../templates/pack-source.ts";
import { mkdirp } from "../utils/fs.ts";
import { pathJoin } from "../utils/path.ts";

const RESOURCE_DESCRIPTIONS: Record<ResourceType, string> = {
  controller: "HTTP controller with route handlers",
  service: "Injectable service class",
  guard: "Route guard for authorization",
  interceptor: "Request/response interceptor",
  pipe: "Data transformation pipe",
  filter: "Exception filter",
  middleware: "HTTP middleware",
  event: "Event class for event-driven patterns",
  pack: "Feature pack with service, types, and config",
};

export async function generateCommand(args: string[]) {
  const [type, name] = args;

  if (!type) {
    p.log.error("Please specify a generator type.");
    console.log();
    console.log("  Available generators:");
    for (const t of RESOURCE_TYPES) {
      console.log(`    ${t.padEnd(14)} ${RESOURCE_DESCRIPTIONS[t]}`);
    }
    console.log();
    console.log("  Example: ambrosia g service user");
    console.log("           ambrosia g controller auth");
    console.log("           ambrosia g pack my-cache");
    console.log();
    process.exit(1);
  }

  if (!RESOURCE_TYPES.includes(type as ResourceType)) {
    p.log.error(`Unknown generator: "${type}"`);
    console.log();
    console.log("  Available generators:");
    for (const t of RESOURCE_TYPES) {
      console.log(`    ${t.padEnd(14)} ${RESOURCE_DESCRIPTIONS[t]}`);
    }
    console.log();
    process.exit(1);
  }

  // Pack has its own special flow
  if (type === "pack") {
    if (!name) {
      p.log.error("Please specify a pack name.");
      console.log();
      console.log("  Example: ambrosia g pack auth");
      console.log("           ambrosia g pack my-cache");
      console.log();
      process.exit(1);
    }
    return generatePack(name);
  }

  // All other resource types
  let resourceName = name;
  if (!resourceName) {
    p.intro(`ambrosia generate ${type}`);
    const input = await p.text({
      message: `Enter ${type} name:`,
      placeholder: `my-${type}`,
      validate: (val) => {
        if (!val.trim()) return `${type} name is required.`;
        if (!/^[a-z][a-z0-9-]*$/.test(val)) return "Use kebab-case (e.g. my-service).";
        return undefined;
      },
    });

    if (p.isCancel(input)) {
      p.outro("Cancelled.");
      process.exit(0);
    }
    resourceName = input as string;
  } else {
    p.intro(`ambrosia generate ${type}`);
  }

  return generateResource(type as ResourceType, resourceName);
}

async function generateResource(type: ResourceType, name: string) {
  const cwd = process.cwd();
  const pascalName = toPascalCase(name);

  // Determine target directory based on resource type
  const targetDir = resolveTargetDir(cwd, type, name);
  const fileName = `${name}${getFileSuffix(type)}`;
  const filePath = pathJoin(targetDir, fileName);

  // Check if file already exists
  if (await Bun.file(filePath).exists()) {
    p.log.error(`File already exists: ${fileName}`);
    p.outro("Aborted.");
    process.exit(1);
  }

  p.log.step(`Creating ${type} "${pascalName}" ...`);

  // Generate content
  const template = getTemplate(type);
  const content = template(name);

  // Write file
  await mkdirp(targetDir);
  await Bun.write(filePath, content);

  // Show relative path from cwd
  const relPath = filePath.replace(cwd.replace(/\\/g, "/") + "/", "");
  p.log.success(`Created ${relPath}`);

  // Show usage hints
  const usageHint = getUsageHint(type, name, pascalName);
  if (usageHint) {
    p.note(usageHint, "Usage");
  }

  p.outro("Done!");
}

/** Resolve the target directory for a resource type. */
function resolveTargetDir(cwd: string, type: ResourceType, name: string): string {
  // Convention: src/<pluralType>/ for standalone resources
  const typeDir: Record<ResourceType, string> = {
    controller: "src/controllers",
    service: "src/services",
    guard: "src/guards",
    interceptor: "src/interceptors",
    pipe: "src/pipes",
    filter: "src/filters",
    middleware: "src/middleware",
    event: "src/events",
    pack: "src/packs",
  };

  return pathJoin(cwd, typeDir[type]);
}

/** Get a usage hint for the generated resource. */
function getUsageHint(type: ResourceType, name: string, pascalName: string): string | null {
  switch (type) {
    case "controller":
      return [
        `import { ${pascalName}Controller } from "./controllers/${name}.controller";`,
        "",
        "// Add to your pack definition:",
        `controllers: [${pascalName}Controller]`,
      ].join("\n");

    case "service":
      return [
        `import { ${pascalName}Service } from "./services/${name}.service";`,
        "",
        "// Add to your pack definition:",
        `providers: [${pascalName}Service]`,
      ].join("\n");

    case "guard":
      return [
        `import { ${pascalName}Guard } from "./guards/${name}.guard";`,
        "",
        "// Use on controller or route:",
        `@UseGuard(${pascalName}Guard)`,
      ].join("\n");

    case "interceptor":
      return [
        `import { ${pascalName}Interceptor } from "./interceptors/${name}.interceptor";`,
        "",
        "// Use on controller or route:",
        `@UseInterceptor(${pascalName}Interceptor)`,
      ].join("\n");

    case "pipe":
      return [
        `import { ${pascalName}Pipe } from "./pipes/${name}.pipe";`,
        "",
        "// Use on a parameter:",
        `@Body(${pascalName}Pipe)`,
      ].join("\n");

    case "filter":
      return [
        `import { ${pascalName}Filter } from "./filters/${name}.filter";`,
        "",
        "// Use on controller or route:",
        `@UseFilter(${pascalName}Filter)`,
      ].join("\n");

    case "middleware":
      return [
        `import { ${pascalName}Middleware } from "./middleware/${name}.middleware";`,
        "",
        "// Use on controller:",
        `@UseMiddleware(${pascalName}Middleware)`,
      ].join("\n");

    case "event":
      return [
        `import { ${pascalName}Event } from "./events/${name}.event";`,
        "",
        `const event = new ${pascalName}Event("user-123");`,
      ].join("\n");

    default:
      return null;
  }
}

async function generatePack(name: string) {
  p.intro("ambrosia generate pack");

  const cwd = process.cwd();
  const pascalName = toPascalCase(name);

  // Detect project context
  const hasPackageJson = await Bun.file(pathJoin(cwd, "package.json")).exists();
  const config = await loadConfig(cwd);

  // Let user choose pack type
  const packType = await p.select({
    message: "What kind of pack do you want to create?",
    options: [
      ...(hasPackageJson
        ? [
            {
              value: "local" as const,
              label: "Local pack (inside this project)",
              hint: config?.packsDir ?? "src/packs",
            },
          ]
        : []),
      {
        value: "standalone" as const,
        label: "Standalone pack (for publishing to registry)",
        hint: "full project with build, registry.json, README",
      },
    ],
  });

  if (p.isCancel(packType)) {
    p.outro("Cancelled.");
    process.exit(0);
  }

  if (packType === "standalone") {
    return generateStandalonePack(name, pascalName, cwd);
  }

  return generateLocalPack(name, pascalName, cwd, config);
}

async function generateLocalPack(
  name: string,
  pascalName: string,
  cwd: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
) {
  const packsDir = config?.packsDir ?? "src/packs";
  const packDir = pathJoin(cwd, packsDir, name);

  if (await Bun.file(pathJoin(packDir, "index.ts")).exists()) {
    p.log.error(`Pack "${name}" already exists at ${packsDir}/${name}/`);
    p.outro("Aborted.");
    process.exit(1);
  }

  p.log.step(`Creating pack "${name}" in ${packsDir}/${name}/`);

  await mkdirp(packDir);

  const files = [
    { path: "index.ts", content: packIndex(name, pascalName) },
    { path: `${name}.pack.ts`, content: packDefinition(name, pascalName) },
    { path: `${name}.service.ts`, content: packService(name, pascalName) },
    { path: "types.ts", content: packTypes(pascalName, name) },
  ];

  for (const file of files) {
    await Bun.write(pathJoin(packDir, file.path), file.content);
  }

  p.log.success(`Created ${files.length} files`);

  const usage = [
    `import { ${pascalName}Pack } from "./${packsDir}/${name}";`,
    "",
    "packs: [",
    `  ${pascalName}Pack.forRoot({`,
    "    enabled: true,",
    "  }),",
    "]",
  ].join("\n");

  p.note(usage, "Usage");
  p.outro("Pack ready!");
}

async function generateStandalonePack(name: string, pascalName: string, cwd: string) {
  const packDir = pathJoin(cwd, name);

  if (await Bun.file(pathJoin(packDir, "package.json")).exists()) {
    p.log.error(`Directory "${name}" already contains a project.`);
    p.outro("Aborted.");
    process.exit(1);
  }

  // Prompt for metadata
  const description = await p.text({
    message: "Pack description:",
    placeholder: `A pack for ${name} functionality`,
  });
  if (p.isCancel(description)) { p.outro("Cancelled."); process.exit(0); }

  const author = await p.text({
    message: "Author:",
    placeholder: "your-name",
  });
  if (p.isCancel(author)) { p.outro("Cancelled."); process.exit(0); }

  const category = await p.select({
    message: "Category:",
    options: [
      { value: "utils", label: "Utils" },
      { value: "http", label: "HTTP" },
      { value: "database", label: "Database" },
      { value: "auth", label: "Auth & Security" },
      { value: "messaging", label: "Messaging" },
      { value: "monitoring", label: "Monitoring" },
      { value: "cache", label: "Cache" },
      { value: "validation", label: "Validation" },
      { value: "tooling", label: "Tooling" },
    ],
  });
  if (p.isCancel(category)) { p.outro("Cancelled."); process.exit(0); }

  const s = p.spinner();
  s.start("Generating standalone pack...");

  await mkdirp(pathJoin(packDir, "src"));

  // package.json
  await Bun.write(
    pathJoin(packDir, "package.json"),
    JSON.stringify(
      {
        name: `ambrosia-pack-${name}`,
        version: "0.1.0",
        description: description as string,
        author: author as string,
        license: "MIT",
        type: "module",
        main: "./src/index.ts",
        peerDependencies: {
          "@ambrosia-unce/core": ">=0.1.0",
        },
      },
      null,
      2,
    ) + "\n",
  );

  // registry.json
  await Bun.write(
    pathJoin(packDir, "registry.json"),
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        description: description as string,
        author: author as string,
        category: category as string,
        tags: [name],
        files: [
          { path: `src/${name}.pack.ts`, type: "pack" },
          { path: `src/${name}.service.ts`, type: "lib" },
          { path: "src/types.ts", type: "lib" },
          { path: "src/index.ts", type: "lib" },
        ],
        dependencies: {},
        devDependencies: {},
        ambrosiaDependencies: ["@ambrosia-unce/core"],
      },
      null,
      2,
    ) + "\n",
  );

  // tsconfig.json
  await Bun.write(
    pathJoin(packDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          declaration: true,
          outDir: "./dist",
          rootDir: "./src",
          types: ["bun-types"],
        },
        include: ["src"],
      },
      null,
      2,
    ) + "\n",
  );

  // Source files
  await Bun.write(pathJoin(packDir, "src/index.ts"), packIndex(name, pascalName));
  await Bun.write(pathJoin(packDir, `src/${name}.pack.ts`), packDefinition(name, pascalName));
  await Bun.write(pathJoin(packDir, `src/${name}.service.ts`), packService(name, pascalName));
  await Bun.write(pathJoin(packDir, "src/types.ts"), packTypes(pascalName, name));

  // README.md
  await Bun.write(
    pathJoin(packDir, "README.md"),
    `# ${name}

${description}

## Installation

\`\`\`bash
ambrosia add ${name}
\`\`\`

## Usage

\`\`\`ts
import { ${pascalName}Pack } from "./${name}";

const AppPack = definePack({
  imports: [
    ${pascalName}Pack.forRoot({
      enabled: true,
    }),
  ],
});
\`\`\`

## Publishing

\`\`\`bash
ambrosia publish
\`\`\`

## License

MIT
`,
  );

  // .gitignore
  await Bun.write(
    pathJoin(packDir, ".gitignore"),
    "node_modules\ndist\n.env\n",
  );

  s.stop("Pack generated!");

  p.log.success(`Created standalone pack in ${name}/`);

  const files = [
    "package.json",
    "registry.json",
    "tsconfig.json",
    "README.md",
    ".gitignore",
    "src/index.ts",
    `src/${name}.pack.ts`,
    `src/${name}.service.ts`,
    "src/types.ts",
  ];
  p.note(files.join("\n"), "Files");

  const nextSteps = [
    `cd ${name}`,
    "bun install",
    "# edit src/ to implement your pack",
    "ambrosia publish   # when ready",
  ].join("\n");

  p.note(nextSteps, "Next steps");
  p.outro("Pack ready!");
}
