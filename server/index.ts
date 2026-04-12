import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import index from "../index.html";

const t = initTRPC.create();

async function helloWorld() {
  await Bun.sleep(500);
  return "Hello World!";
}

export const appRouter = t.router({
  helloWorld: t.procedure.query(helloWorld),
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
  development: true,
});

console.log("tRPC server running on http://localhost:3000");
