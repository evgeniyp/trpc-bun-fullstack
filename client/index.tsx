import "@mantine/core/styles.css";

import { Button, Center, MantineProvider, Stack, Title } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { createRoot } from "react-dom/client";
import type { AppRouter } from "../server/index";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/trpc" })],
});

function App() {
  const { data, error, isFetching, refetch } = trpc.getUserCount.useQuery(
    undefined,
    { retry: false, refetchOnWindowFocus: false },
  );

  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Title order={1}>
          {isFetching
            ? "Loading..."
            : error
              ? `Error: ${error.message}`
              : `Users: ${data}`}
        </Title>
        <Button variant="light" onClick={() => refetch()} loading={isFetching}>
          Reload
        </Button>
      </Stack>
    </Center>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <MantineProvider defaultColorScheme="dark">
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </MantineProvider>,
);
