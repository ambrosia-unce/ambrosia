import Bun, { $ } from "bun";

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
});

await $`tsc --emitDeclarationOnly --outDir dist --noEmit false`;
