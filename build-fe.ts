import { cp } from "node:fs/promises";

await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
});

await cp("./static", "./dist", { recursive: true });
