import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { useBeforeUnloadGuard } from "./useBeforeUnloadGuard";
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

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameOpen, { open: openRename, close: closeRename }] = useDisclosure(false);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    openDelete();
  };

  const confirmDelete = () => {
    if (pendingDeleteId) deleteClip(pendingDeleteId);
    closeDelete();
    setPendingDeleteId(null);
  };

  const requestRename = (id: string, currentName: string) => {
    setPendingRenameId(id);
    setRenameValue(currentName);
    openRename();
  };

  const confirmRename = () => {
    if (pendingRenameId && renameValue.trim()) renameClip(pendingRenameId, renameValue.trim());
    closeRename();
    setPendingRenameId(null);
  };

  useBeforeUnloadGuard(isRecording || clips.length > 0);

  const handleRecord = () => {
    audioRefs.current.get(playingId!)?.pause();
    start();
  };

  if (error) return <Text c="red">{error.message}</Text>;
  if (!stream) return <Text c="dimmed">Requesting microphone…</Text>;

  const usedPct = (usedBytes / MEMORY_BUDGET_BYTES) * 100;
  const pendingDeleteClip = clips.find((c) => c.id === pendingDeleteId);

  return (
    <Stack>
      <Stack gap="xs">
        {clips.map((clip) => (
          <Group key={clip.id}>
            {/** biome-ignore lint/a11y/useMediaCaption: no captions unless this track is transcribed in BE */}
            <audio
              ref={(el) => {
                if (el) audioRefs.current.set(clip.id, el);
                else audioRefs.current.delete(clip.id);
              }}
              src={clip.url}
              controls
              onPlay={() => { setPlayingId(clip.id); }}
              onPause={() => { setPlayingId(null); }}
              onEnded={() => { setPlayingId(null); }}
              style={isRecording ? { pointerEvents: "none", opacity: 0.4 } : undefined}
            />
            <Text>{clip.name}</Text>
            <Button size="xs" color="blue" onClick={() => requestRename(clip.id, clip.name)}>
              Rename
            </Button>
            <Button size="xs" color="red" onClick={() => requestDelete(clip.id)}>
              Delete
            </Button>
          </Group>
        ))}
      </Stack>

      <Group>
        <Button onClick={handleRecord} disabled={isRecording || !!playingId}>
          Record
        </Button>
        <Button onClick={isPaused ? resume : pause} disabled={!isRecording}>
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={stop} disabled={!isRecording}>
          Stop
        </Button>
      </Group>

      <Modal opened={deleteOpen} onClose={closeDelete} title="Delete clip" size="sm">
        <Text mb="md">
          Delete &ldquo;{pendingDeleteClip?.name}&rdquo;? This cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" onClick={confirmDelete}>Delete</Button>
        </Group>
      </Modal>

      <Modal opened={renameOpen} onClose={closeRename} title="Rename clip" size="sm">
        <TextInput
          value={renameValue}
          onChange={(e) => { setRenameValue(e.currentTarget.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); }}
          data-autofocus
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={closeRename}>Cancel</Button>
          <Button onClick={confirmRename} disabled={!renameValue.trim()}>Rename</Button>
        </Group>
      </Modal>

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
