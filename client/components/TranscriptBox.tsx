import { Paper, Text } from "@mantine/core";
import type { TranscribeState } from "../hooks/useTranscribe";

type Props = { state: TranscribeState };

export function TranscriptBox({ state }: Props) {
  if (state.status === "idle") return null;

  return (
    <Paper withBorder p="xs" ml={4}>
      <Text size="sm" c={state.status === "error" ? "red" : "inherit"}>
        {state.status === "done"
          ? state.text
          : state.status === "error"
            ? `Transcription failed: ${state.message}`
            : " "}
      </Text>
    </Paper>
  );
}
