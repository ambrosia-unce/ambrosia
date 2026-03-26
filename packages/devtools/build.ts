import Bun, { $ } from "bun";

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  external: [
    "@ambrosia-unce/core",
    "@ambrosia-unce/http",
    "@ambrosia-unce/events",
    "@ambrosia-unce/config",
    "reflect-metadata",
  ],
});

await $`tsc --emitDeclarationOnly --outDir dist --noEmit false`;
