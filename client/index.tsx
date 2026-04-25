import "@mantine/core/styles.css";

import { Badge, Center, MantineProvider, Stack, Title } from "@mantine/core";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AudioRecorder } from "./AudioRecorder";
import { useConnection } from "./useConnection";

function ConnectionBadge() {
  const online = useConnection();

  useEffect(() => {
    if (online) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [online]);

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
          <AudioRecorder />
        </Stack>
      </Center>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <MantineProvider defaultColorScheme="dark">
    <App />
  </MantineProvider>,
);
