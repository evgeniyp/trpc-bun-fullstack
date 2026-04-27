import "@mantine/core/styles.css";

import { Center, MantineProvider, Stack, Title } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { AudioRecorder } from "./AudioRecorder";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="xl">
        <Title order={1}>Audio Recorder</Title>
        <ErrorBoundary>
          <AudioRecorder />
        </ErrorBoundary>
      </Stack>
    </Center>
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
