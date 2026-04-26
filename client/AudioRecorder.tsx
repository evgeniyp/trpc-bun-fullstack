import { Text } from "@mantine/core";
import { useAudioStream } from "./useAudioStream";

export function AudioRecorder() {
  const { stream, error } = useAudioStream();

  if (error) return <Text c="red">{error.message}</Text>;
  if (!stream) return <Text c="dimmed">Requesting microphone…</Text>;

  return <Text c="green">Microphone active ({stream.getTracks().length} track)</Text>;
}
