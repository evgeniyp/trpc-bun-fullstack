import { Button, Group, Stack, Text } from "@mantine/core";
import { MEMORY_BUDGET_BYTES } from "./audioConfig";
import { useAudioStream } from "./useAudioStream";
import { useMediaRecorder } from "./useMediaRecorder";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function AudioRecorder() {
  const { stream, error } = useAudioStream();
  const {
    start,
    stop,
    pause,
    resume,
    isRecording,
    isPaused,
    clips,
    usedBytes,
    deleteClip,
    renameClip,
  } = useMediaRecorder(stream);

  if (error) return <Text c="red">{error.message}</Text>;
  if (!stream) return <Text c="dimmed">Requesting microphone…</Text>;

  const usedPct = (usedBytes / MEMORY_BUDGET_BYTES) * 100;

  return (
    <Stack>
      <Group>
        <Button onClick={start} disabled={isRecording}>
          Record
        </Button>
        <Button onClick={isPaused ? resume : pause} disabled={!isRecording}>
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={stop} disabled={!isRecording}>
          Stop
        </Button>
      </Group>

      <Stack gap="xs">
        {clips.map((clip) => (
          <Group key={clip.id}>
            <audio src={clip.url} controls />
            <Text
              style={{ cursor: "pointer" }}
              onClick={() => {
                const name = prompt("Rename clip", clip.name);
                if (name) renameClip(clip.id, name);
              }}
            >
              {clip.name}
            </Text>
            <Button size="xs" color="red" onClick={() => deleteClip(clip.id)}>
              Delete
            </Button>
          </Group>
        ))}
      </Stack>

      <Text
        size="xs"
        c={usedPct > 80 ? "red" : "dimmed"}
        style={{ position: "fixed", bottom: 8, right: 12 }}
      >
        {formatBytes(usedBytes)} / {formatBytes(MEMORY_BUDGET_BYTES)} ({usedPct.toFixed(1)}%)
      </Text>
    </Stack>
  );
}
