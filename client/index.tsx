import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createRoot } from "react-dom/client";
import type { AppRouter } from "../server/index";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:3000/trpc" })],
});

function App() {
  const { data, error, isFetching, refetch } = trpc.helloWorld.useQuery(
    undefined,
    { retry: false, refetchOnWindowFocus: false },
  );

  return (
    <>
      <h1>
        {isFetching ? "Loading..." : error ? `Error: ${error.message}` : data}
      </h1>
      <button type="button" onClick={() => refetch()} disabled={isFetching}>
        Reload
      </button>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>,
);
