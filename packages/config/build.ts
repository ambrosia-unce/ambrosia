import Bun, { $ } from "bun";

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  external: ["@ambrosia-unce/core", "reflect-metadata"],
});

await $`tsc --emitDeclarationOnly --outDir dist --noEmit false`;
