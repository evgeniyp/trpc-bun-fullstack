import { cp, rm } from "node:fs/promises";

await rm("./dist", { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
});

for (const log of result.logs) console.log(log);

if (!result.success) {
  console.error("Build failed");
  process.exit(1);
}

for (const output of result.outputs) {
  const sizeKb = (output.size / 1024).toFixed(1);
  console.log(`  ${output.path}  ${sizeKb} KB`);
}

await cp("./static", "./dist", { recursive: true });

console.log("Copied static/ → dist/");
