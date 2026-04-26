import "@mantine/core/styles.css";

import { Badge, Center, MantineProvider, Stack, Title } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { AudioRecorder } from "./AudioRecorder";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useBeforeUnloadGuard } from "./hooks/useBeforeUnloadGuard";
import { useConnection } from "./hooks/useConnection";

function ConnectionBadge() {
  const online = useConnection();
  useBeforeUnloadGuard(!online);

  return (
    <Badge
      color={online ? "green" : "red"}
      variant="filled"
      style={{ position: "fixed", top: 12, right: 12 }}
    >
      {online ? "Online" : "Offline"}
    </Badge>
  );
}

function App() {
  return (
    <>
      <ConnectionBadge />
      <Center h="100vh">
        <Stack align="center" gap="xl">
          <Title order={1}>Audio Recorder</Title>
          <ErrorBoundary>
            <AudioRecorder />
          </ErrorBoundary>
        </Stack>
      </Center>
    </>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <MantineProvider defaultColorScheme="dark">
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </MantineProvider>,
);
