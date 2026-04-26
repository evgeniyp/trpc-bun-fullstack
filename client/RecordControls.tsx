import { Button, Group, Text } from "@mantine/core";
import { formatDuration } from "./useRecordingTimer";

type Props = {
  isRecording: boolean;
  isPaused: boolean;
  isOverLimit: boolean;
  hasPlayback: boolean;
  elapsed: number;
  onRecord: () => void;
  onPauseResume: () => void;
  onStop: () => void;
};

export function RecordControls({
  isRecording,
  isPaused,
  isOverLimit,
  hasPlayback,
  elapsed,
  onRecord,
  onPauseResume,
  onStop,
}: Props) {
  return (
    <Group>
      <Button onClick={onRecord} disabled={isRecording || hasPlayback || isOverLimit}>
        Record
      </Button>
      <Button onClick={onPauseResume} disabled={!isRecording}>
        {isPaused ? "Resume" : "Pause"}
      </Button>
      <Button onClick={onStop} disabled={!isRecording}>
        Stop
      </Button>
      {isRecording && (
        <Text c={isPaused ? "dimmed" : "red"} ff="monospace">
          {formatDuration(elapsed)}
        </Text>
      )}
    </Group>
  );
}
