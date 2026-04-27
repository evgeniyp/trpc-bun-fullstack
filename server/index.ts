import { memoryUsage } from "bun:jsc";
import index from "../index.html";

const isDev = process.argv.includes("--dev");

Bun.serve({
  routes: {
    "/": index,
    "/api/transcribe": {
      async POST(_req) {
        await Bun.sleep(3000);
        return Response.json({ text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." });
      },
    },
    "/api/*": (_req) => {
      return new Response("Not Implemented", { status: 501 });
    },
  },
  async fetch(req) {
    const url = new URL(req.url);
    const file = Bun.file(`./static${url.pathname}`);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response("Not Found", { status: 404 });
  },
  development: isDev,
});

console.log("Server running on http://localhost:3000");

if (isDev) {
  setInterval(() => {
    const mem = memoryUsage();
    console.log(`Memory usage: ${(mem.current / 1024 / 1024).toFixed(2)}`);
  }, 10000);
}
