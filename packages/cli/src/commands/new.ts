import * as p from "@clack/prompts";
import { buildCleanFiles } from "../templates/architectures/clean";
import { buildCqrsFiles } from "../templates/architectures/cqrs";
import { buildLayeredFiles } from "../templates/architectures/layered";
import {
  biomeJson,
  buildTs,
  bunfigToml,
  envExample,
  gitignore,
  packageJson,
  tsconfig,
} from "../templates/base";
import {
  authGuard,
  corsMiddleware,
  httpExceptionFilter,
  loggingInterceptor,
} from "../templates/common";
import { healthController, healthService } from "../templates/health";
import { mainTs } from "../templates/main";
import { healthPack, userPack } from "../templates/pack";
import { appTest } from "../templates/test";
import {
  createUserDto,
  updateUserDto,
  userController,
  userEntity,
  userService,
} from "../templates/user";
import { mkdirp } from "../utils/fs";
import { pathBasename, pathJoin, pathResolve } from "../utils/path";

type Architecture = "modular" | "layered" | "clean" | "cqrs";

interface FileEntry {
  path: string;
  content: string;
}

const ARCHITECTURE_LABELS: Record<Architecture, string> = {
  modular: "Modular",
  layered: "Layered",
  clean: "Clean Architecture",
  cqrs: "CQRS",
};

function buildModularFiles(name: string): FileEntry[] {
  return [
    // Source entry
    { path: "src/main.ts", content: mainTs() },

    // Health module
    { path: "src/modules/health/health.controller.ts", content: healthController() },
    { path: "src/modules/health/health.service.ts", content: healthService() },
    { path: "src/modules/health/health.pack.ts", content: healthPack() },

    // User module
    { path: "src/modules/user/user.controller.ts", content: userController() },
    { path: "src/modules/user/user.service.ts", content: userService() },
    { path: "src/modules/user/user.pack.ts", content: userPack() },
    { path: "src/modules/user/dto/create-user.dto.ts", content: createUserDto() },
    { path: "src/modules/user/dto/update-user.dto.ts", content: updateUserDto() },
    { path: "src/modules/user/entities/user.entity.ts", content: userEntity() },

    // Common
    { path: "src/common/guards/auth.guard.ts", content: authGuard() },
    { path: "src/common/interceptors/logging.interceptor.ts", content: loggingInterceptor() },
    { path: "src/common/filters/http-exception.filter.ts", content: httpExceptionFilter() },
    { path: "src/common/middleware/cors.middleware.ts", content: corsMiddleware() },

    // Tests
    { path: "test/app.test.ts", content: appTest() },
  ];
}

function buildArchitectureFiles(name: string, arch: Architecture): FileEntry[] {
  switch (arch) {
    case "modular":
      return buildModularFiles(name);
    case "layered":
      return buildLayeredFiles(name);
    case "clean":
      return buildCleanFiles(name);
    case "cqrs":
      return buildCqrsFiles(name);
  }
}

function buildBaseFiles(name: string): FileEntry[] {
  return [
    { path: "package.json", content: packageJson(name) },
    { path: "tsconfig.json", content: tsconfig() },
    { path: "biome.json", content: biomeJson() },
    { path: "bunfig.toml", content: bunfigToml() },
    { path: ".gitignore", content: gitignore() },
    { path: ".env.example", content: envExample() },
    { path: "build.ts", content: buildTs() },
  ];
}

function collectDirs(files: FileEntry[]): string[] {
  const dirs = new Set<string>();
  for (const file of files) {
    const parts = file.path.split("/");
    for (let i = 1; i <= parts.length - 1; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  return [...dirs].sort();
}

export async function newCommand(target: string, archFlag?: string) {
  p.intro("ambrosia new");

  const projectDir = pathResolve(process.cwd(), target);
  const projectName = pathBasename(projectDir);

  // Check if directory already contains a project
  try {
    const exists = await Bun.file(pathJoin(projectDir, "package.json")).exists();
    if (exists) {
      p.log.error(`Directory "${projectName}" already contains a project.`);
      p.outro("Aborted.");
      process.exit(1);
    }
  } catch {
    // Directory doesn't exist — that's fine
  }

  // Select architecture
  let arch: Architecture;

  if (archFlag && archFlag in ARCHITECTURE_LABELS) {
    arch = archFlag as Architecture;
  } else {
    const selected = await p.select({
      message: "Select architecture pattern:",
      options: [
        { value: "modular", label: "Modular", hint: "recommended — feature-based modules" },
        { value: "layered", label: "Layered", hint: "simple — flat layers" },
        { value: "clean", label: "Clean Architecture", hint: "domain-driven design" },
        { value: "cqrs", label: "CQRS", hint: "command/query separation" },
      ],
    });

    if (p.isCancel(selected)) {
      p.outro("Cancelled.");
      process.exit(0);
    }

    arch = selected as Architecture;
  }

  p.log.step(`Creating "${projectName}" with ${ARCHITECTURE_LABELS[arch]} architecture...`);

  // Build file list
  const baseFiles = buildBaseFiles(projectName);
  const archFiles = buildArchitectureFiles(projectName, arch);
  const files = [...baseFiles, ...archFiles];

  // Create directories
  const dirs = collectDirs(files);
  for (const dir of dirs) {
    await mkdirp(pathJoin(projectDir, dir));
  }

  // Write files
  for (const file of files) {
    await Bun.write(pathJoin(projectDir, file.path), file.content);
  }
  p.log.success(`Created ${files.length} files`);

  // Install dependencies
  const installSpinner = p.spinner();
  installSpinner.start("Installing dependencies...");
  try {
    const proc = Bun.spawn(["bun", "install"], {
      cwd: projectDir,
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      installSpinner.stop("Dependencies installed");
    } else {
      installSpinner.stop("Dependencies installation failed");
      p.log.warn("Run 'bun install' manually in the project directory.");
    }
  } catch {
    installSpinner.stop("Could not run bun install");
    p.log.warn("Run 'bun install' manually in the project directory.");
  }

  // Init git
  const gitSpinner = p.spinner();
  gitSpinner.start("Initializing git repository...");
  try {
    const proc = Bun.spawn(["git", "init"], {
      cwd: projectDir,
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      gitSpinner.stop("Git repository initialized");
    } else {
      gitSpinner.stop("Could not initialize git repository");
    }
  } catch {
    gitSpinner.stop("Git not available, skipping");
  }

  const nextSteps = [
    `cd ${projectName}`,
    `bun run dev`,
    "",
    "Available scripts:",
    "  bun run dev       Start development server with watch mode",
    "  bun run start     Start production server",
    "  bun run build     Build for production",
    "  bun run lint      Check code with Biome",
    "  bun run test      Run tests",
  ].join("\n");

  p.note(nextSteps, "Next steps");
  p.outro("Done!");
}
