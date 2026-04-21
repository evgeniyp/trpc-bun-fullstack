import { memoryUsage } from "bun:jsc";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { count } from "drizzle-orm";
import index from "../index.html";
import { db } from "./db/index";
import { users } from "./db/schema";

const t = initTRPC.create();

async function getUserCount() {
  await Bun.sleep(500);

  if (Math.random() < 0.2) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Random server error!",
    });
  }

  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count;
}

export const appRouter = t.router({
  getUserCount: t.procedure.query(getUserCount),
});

export type AppRouter = typeof appRouter;

Bun.serve({
  routes: {
    "/": index,
    "/trpc/*": (req) =>
      fetchRequestHandler({
        endpoint: "/trpc",
        req,
        router: appRouter,
        createContext: () => ({}),
      }),
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
  development: true,
});

console.log("tRPC server running on http://localhost:3000");

setInterval(() => {
  const mem = memoryUsage();
  console.log(`Memory usage: ${(mem.current / 1024 / 1024).toFixed(2)}`);
}, 10000);
