import { Alert, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useRef, useState } from "react";
import { MEMORY_BUDGET_BYTES, RECORDING_BYTES_PER_SEC } from "./audioConfig";
import { ClipList } from "./ClipList";
import { DeleteClipModal } from "./DeleteClipModal";
import { RecordControls } from "./RecordControls";
import { RenameClipModal } from "./RenameClipModal";
import { useAudioStream } from "./useAudioStream";
import { useBeforeUnloadGuard } from "./useBeforeUnloadGuard";
import { useMediaRecorder } from "./useMediaRecorder";
import { formatDuration, useRecordingTimer } from "./useRecordingTimer";
import { Waveform } from "./Waveform";

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

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameOpen, { open: openRename, close: closeRename }] = useDisclosure(false);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const refSettersRef = useRef<Map<string, (el: HTMLAudioElement | null) => void>>(new Map());

  const setAudioRef = useCallback((id: string) => {
    const cached = refSettersRef.current.get(id);
    if (cached) return cached;
    const setter = (el: HTMLAudioElement | null) => {
      if (el) audioRefs.current.set(id, el);
      else {
        audioRefs.current.delete(id);
        refSettersRef.current.delete(id);
      }
    };
    refSettersRef.current.set(id, setter);
    return setter;
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setPendingDeleteId(id);
      openDelete();
    },
    [openDelete],
  );

  const confirmDelete = () => {
    if (pendingDeleteId) {
      audioRefs.current.get(pendingDeleteId)?.pause();
      if (playingId === pendingDeleteId) setPlayingId(null);
      deleteClip(pendingDeleteId);
    }
    closeDelete();
    setPendingDeleteId(null);
  };

  const handleRename = useCallback(
    (id: string, currentName: string) => {
      setPendingRenameId(id);
      setRenameValue(currentName);
      openRename();
    },
    [openRename],
  );

  const confirmRename = () => {
    if (pendingRenameId && renameValue.trim()) renameClip(pendingRenameId, renameValue.trim());
    closeRename();
    setPendingRenameId(null);
  };

  const handlePlay = useCallback((id: string) => {
    setPlayingId(id);
  }, []);
  const handlePauseOrEnd = useCallback(() => {
    setPlayingId(null);
  }, []);

  useBeforeUnloadGuard(isRecording || clips.length > 0);
  const elapsed = useRecordingTimer(isRecording, isPaused);

  const handleRecord = () => {
    if (playingId) audioRefs.current.get(playingId)?.pause();
    start();
  };

  if (error) return <Text c="red">{error.message}</Text>;
  if (!stream) return <Text c="dimmed">Requesting microphone…</Text>;

  const usedPct = (usedBytes / MEMORY_BUDGET_BYTES) * 100;
  const isOverLimit = usedBytes >= MEMORY_BUDGET_BYTES;
  const remainingMs = Math.max(
    0,
    ((MEMORY_BUDGET_BYTES - usedBytes) / RECORDING_BYTES_PER_SEC) * 1000,
  );
  const pendingDeleteClip = clips.find((c) => c.id === pendingDeleteId);
  const playingElement = playingId ? (audioRefs.current.get(playingId) ?? null) : null;
  const visualizerSource = isRecording ? stream : playingElement;
  const visualizerColor = isRecording ? "crimson" : "steelblue";

  return (
    <Stack>
      <Waveform source={visualizerSource} color={visualizerColor} paused={isPaused} />

      <ClipList
        clips={clips}
        isRecording={isRecording}
        setAudioRef={setAudioRef}
        onPlay={handlePlay}
        onPauseOrEnd={handlePauseOrEnd}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      {isOverLimit && (
        <Alert color="red" title="Storage limit reached">
          Delete clips to free space before recording again.
        </Alert>
      )}

      <RecordControls
        isRecording={isRecording}
        isPaused={isPaused}
        isOverLimit={isOverLimit}
        hasPlayback={!!playingId}
        elapsed={elapsed}
        onRecord={handleRecord}
        onPauseResume={isPaused ? resume : pause}
        onStop={stop}
      />

      <DeleteClipModal
        opened={deleteOpen}
        clipName={pendingDeleteClip?.name}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />

      <RenameClipModal
        opened={renameOpen}
        value={renameValue}
        onChange={setRenameValue}
        onClose={closeRename}
        onConfirm={confirmRename}
      />

      <Text
        size="xs"
        c={remainingMs < 60_000 ? "red" : "dimmed"}
        style={{ position: "fixed", bottom: 8, right: 12 }}
      >
        {formatBytes(usedBytes)} / {formatBytes(MEMORY_BUDGET_BYTES)} ({usedPct.toFixed(1)}%) — ~
        {formatDuration(remainingMs)} left
      </Text>
    </Stack>
  );
}
