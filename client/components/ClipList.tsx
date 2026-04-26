import { Button, Group, Loader, Menu, Stack, Text } from "@mantine/core";
import { memo, useCallback, useState } from "react";
import type { Clip } from "../hooks/useMediaRecorder";
import { saveClip } from "../utils/saveClip";

function mimeToLabel(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim() ?? "";
  const labels: Record<string, string> = {
    "audio/webm": "WebM",
    "audio/mp4": "M4A",
    "audio/ogg": "OGG",
  };
  return labels[base] ?? base;
}

type ClipRowProps = {
  clip: Clip;
  isRecording: boolean;
  setRef: (el: HTMLAudioElement | null) => void;
  onPlay: () => void;
  onPause: () => void;
  onRename: () => void;
  onDelete: () => void;
};

const ClipRow = memo(function ClipRow({
  clip,
  isRecording,
  setRef,
  onPlay,
  onPause,
  onRename,
  onDelete,
}: ClipRowProps) {
  const [encoding, setEncoding] = useState<{ format: "original" | "mp3"; progress: number } | null>(
    null,
  );

  const handleSave = async (format: "original" | "mp3") => {
    setEncoding({ format, progress: 0 });
    try {
      await saveClip(clip, format, (p) => {
        setEncoding({ format, progress: p });
      });
    } finally {
      setEncoding(null);
    }
  };

  const isEncoding = encoding !== null;
  const pct = encoding ? Math.round(encoding.progress * 100) : 0;

  return (
    <Group>
      {/** biome-ignore lint/a11y/useMediaCaption: no captions unless this track is transcribed in BE */}
      <audio
        ref={setRef}
        src={clip.url}
        controls
        controlsList="nodownload"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onPause}
        style={isRecording ? { pointerEvents: "none", opacity: 0.4 } : undefined}
      />
      <Text>{clip.name}</Text>
      <Button size="xs" color="blue" onClick={onRename} disabled={isEncoding}>
        Rename
      </Button>
      <Menu position="bottom-end" disabled={isEncoding}>
        <Menu.Target>
          <Button
            size="xs"
            color="green"
            disabled={isEncoding}
            leftSection={isEncoding ? <Loader size="xs" color="white" /> : undefined}
          >
            {isEncoding ? (encoding.format === "mp3" ? `Encoding ${pct}%` : "Saving…") : "Save"}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => handleSave("original")}>
            Original ({mimeToLabel(clip.mimeType)})
          </Menu.Item>
          <Menu.Item onClick={() => handleSave("mp3")}>MP3</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Button size="xs" color="red" onClick={onDelete} disabled={isEncoding}>
        Delete
      </Button>
    </Group>
  );
});

type Props = {
  clips: Clip[];
  isRecording: boolean;
  setAudioRef: (id: string) => (el: HTMLAudioElement | null) => void;
  onPlay: (id: string) => void;
  onPauseOrEnd: () => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
};

export function ClipList({
  clips,
  isRecording,
  setAudioRef,
  onPlay,
  onPauseOrEnd,
  onRename,
  onDelete,
}: Props) {
  const playHandler = useCallback((id: string) => () => onPlay(id), [onPlay]);
  const renameHandler = useCallback(
    (id: string, name: string) => () => onRename(id, name),
    [onRename],
  );
  const deleteHandler = useCallback((id: string) => () => onDelete(id), [onDelete]);

  return (
    <Stack gap="xs">
      {clips.map((clip) => (
        <ClipRow
          key={clip.id}
          clip={clip}
          isRecording={isRecording}
          setRef={setAudioRef(clip.id)}
          onPlay={playHandler(clip.id)}
          onPause={onPauseOrEnd}
          onRename={renameHandler(clip.id, clip.name)}
          onDelete={deleteHandler(clip.id)}
        />
      ))}
    </Stack>
  );
}
