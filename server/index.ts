import { memoryUsage } from "bun:jsc";
import index from "../index.html";

const isDev = process.argv.includes("--dev");

Bun.serve({
  routes: {
    "/": index,
  },
  fetch(req, server) {
    if (new URL(req.url).pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Upgrade failed", { status: 400 });
    }
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    message(ws, msg) {
      if (msg === "ping") ws.send("pong");
    },
  },
  development: isDev,
});

console.log("Server running on http://localhost:3000");

setInterval(() => {
  const mem = memoryUsage();
  console.log(`Memory usage: ${(mem.current / 1024 / 1024).toFixed(2)}`);
}, 10000);
