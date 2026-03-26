#!/usr/bin/env bun

import { addCommand } from "./commands/add.ts";
import { buildCommand } from "./commands/build.ts";
import { doctorCommand } from "./commands/doctor.ts";
import { generateCommand } from "./commands/generate.ts";
import { infoCommand } from "./commands/info.ts";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";
import { newCommand } from "./commands/new.ts";
import { publishCommand } from "./commands/publish.ts";
import { removeCommand } from "./commands/remove.ts";
import { searchCommand } from "./commands/search.ts";
import { updateCommand } from "./commands/update.ts";
import { upgradeCommand } from "./commands/upgrade.ts";

const HELP = `
  Usage: ambrosia <command> [options]

  Commands:
    new <name>              Create a new Ambrosia project
    init                    Initialize ambrosia.json in current project
    add <pack...>           Add packs from the registry
    remove <pack...>        Remove installed packs
    search <query>          Search packs in the registry
    list                    List installed packs
    update [pack...]        Update installed packs (all if none specified)
    build                   Build registry JSON from registry.json manifest
    publish                 Build and publish a pack to the registry
    doctor                  Check project health and diagnose issues
    info                    Show project and environment information
    upgrade                 Upgrade @ambrosia/* packages to latest versions
    generate|g <type> <n>   Generate a resource

  Generators:
    controller <name>       HTTP controller with route handlers
    service <name>          Injectable service class
    guard <name>            Route guard for authorization
    interceptor <name>      Request/response interceptor
    pipe <name>             Data transformation pipe
    filter <name>           Exception filter
    middleware <name>        HTTP middleware
    event <name>            Event class for event-driven patterns
    pack <name>             Feature pack with service, types, and config

  Options:
    --arch <pattern>        Architecture pattern: modular, layered, clean, cqrs
    --registry <name>       Registry to use for add/search (default: "default")
    --help, -h              Show this help message
    --version, -v           Show version

  Examples:
    ambrosia new my-app
    ambrosia new my-app --arch clean
    ambrosia init
    ambrosia add jwt-auth
    ambrosia add jwt-auth redis-cache --registry company
    ambrosia remove jwt-auth
    ambrosia search auth
    ambrosia list
    ambrosia update
    ambrosia update jwt-auth
    ambrosia build
    ambrosia publish
    ambrosia doctor
    ambrosia info
    ambrosia upgrade
    ambrosia g controller user
    ambrosia g service auth
    ambrosia g guard jwt
    ambrosia g pack my-cache
`;

function parseFlag(args: string[], flag: string): string | undefined {
  // --flag=value
  const eqPrefix = `${flag}=`;
  const eqArg = args.find((a) => a.startsWith(eqPrefix));
  if (eqArg) return eqArg.slice(eqPrefix.length);

  // --flag value
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith("-")) {
    return args[idx + 1];
  }

  return undefined;
}

function extractPositionalArgs(args: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("-")) {
      // Skip flag and its value
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        i++;
      }
      continue;
    }
    result.push(args[i]);
  }
  return result;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "new": {
      const name = rest.find((a) => !a.startsWith("-"));
      if (!name) {
        console.error("  Error: Please specify a project name.\n");
        console.error("  Example: ambrosia new my-app");
        console.error("           ambrosia new ./apps/my-app\n");
        process.exit(1);
      }
      const arch = parseFlag(rest, "--arch");
      return newCommand(name, arch);
    }

    case "init":
      return initCommand();

    case "add": {
      const packNames = extractPositionalArgs(rest);
      const registry = parseFlag(rest, "--registry");
      return addCommand(packNames, { registry });
    }

    case "remove": {
      const packNames = extractPositionalArgs(rest);
      return removeCommand(packNames);
    }

    case "search": {
      const query = rest.find((a) => !a.startsWith("-")) ?? "";
      const registry = parseFlag(rest, "--registry");
      return searchCommand(query, { registry });
    }

    case "list":
      return listCommand();

    case "update": {
      const packNames = extractPositionalArgs(rest);
      return updateCommand(packNames);
    }

    case "build":
      return buildCommand();

    case "publish":
      return publishCommand();

    case "doctor":
      return doctorCommand();

    case "info":
      return infoCommand();

    case "upgrade":
      return upgradeCommand();

    case "generate":
    case "g":
      return generateCommand(rest);

    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      return;

    case "--version":
    case "-v": {
      const pkg = await import("../package.json");
      console.log(`@ambrosia/cli v${pkg.version}`);
      return;
    }

    default:
      console.error(`  Unknown command: "${command}"\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
