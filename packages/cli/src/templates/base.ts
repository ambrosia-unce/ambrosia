export function packageJson(name: string): string {
  return `{
  "name": "${name}",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/main.ts",
    "start": "bun run src/main.ts",
    "build": "bun run build.ts",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "bun test"
  },
  "dependencies": {
    "@ambrosia/core": "^0.1.0",
    "@ambrosia/http": "^0.1.0",
    "@ambrosia/http-elysia": "^0.1.0",
    "@ambrosia/validator": "^0.1.0",
    "elysia": "^1.4.22",
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.13",
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
`;
}

export function tsconfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowSyntheticDefaultImports": true,
    "types": ["bun-types"],
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
}

export function biomeJson(): string {
  return `{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
`;
}

export function gitignore(): string {
  return `node_modules/
dist/
.env
*.log
.DS_Store
`;
}

export function envExample(): string {
  return `PORT=3000
NODE_ENV=development
`;
}

export function buildTs(): string {
  return `await Bun.build({
  entrypoints: ["src/main.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
});
`;
}

export function bunfigToml(): string {
  return `# Bun configuration
preload = ["@ambrosia/validator/preload"]
`;
}
