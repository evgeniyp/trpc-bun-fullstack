import { ActionIcon, Badge, Button, Group, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";

type RecorderStatus =
  | "idle"
  | "denied"
  | "ready"
  | "recording"
  | "paused"
  | "stopped";

interface AudioRecorderState {
  status: RecorderStatus;
  blob: Blob | null;
  duration: number;
}

function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    status: "idle",
    blob: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          setState((s) => ({ ...s, status: "ready" }));
        } else if (result.state === "denied") {
          setState((s) => ({ ...s, status: "denied" }));
        }
        result.onchange = () => {
          if (result.state === "granted")
            setState((s) => ({ ...s, status: "ready" }));
          else if (result.state === "denied")
            setState((s) => ({ ...s, status: "denied" }));
          else setState((s) => ({ ...s, status: "idle" }));
        };
      })
      .catch(() => {});
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setState((s) => ({
        ...s,
        duration: accumulatedRef.current + (Date.now() - startTimeRef.current),
      }));
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    accumulatedRef.current += Date.now() - startTimeRef.current;
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      accumulatedRef.current = 0;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setState((s) => ({ ...s, status: "stopped", blob }));
      };

      recorder.start(100);
      setState((s) => ({ ...s, status: "recording", blob: null }));
      startTimer();
    } catch {
      setState((s) => ({ ...s, status: "denied" }));
    }
  }, [startTimer]);

  const pause = useCallback(() => {
    mediaRecorderRef.current?.pause();
    stopTimer();
    setState((s) => ({ ...s, status: "paused" }));
  }, [stopTimer]);

  const resume = useCallback(() => {
    mediaRecorderRef.current?.resume();
    setState((s) => ({ ...s, status: "recording" }));
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    stopTimer();
    mediaRecorderRef.current?.stop();
    setState((s) => ({ ...s, duration: accumulatedRef.current }));
  }, [stopTimer]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    setState({ status: "ready", blob: null, duration: 0 });
  }, []);

  const download = useCallback(
    (filename?: string) => {
      if (!state.blob) return;
      const ext = state.blob.type.includes("ogg") ? "ogg" : "webm";
      const url = URL.createObjectURL(state.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `recording-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [state.blob],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { ...state, start, pause, resume, stop, reset, download };
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const STATUS_LABELS: Record<RecorderStatus, string> = {
  idle: "Ready",
  denied: "Microphone Denied",
  ready: "Ready",
  recording: "Recording",
  paused: "Paused",
  stopped: "Done",
};

const STATUS_COLORS: Record<RecorderStatus, string> = {
  idle: "gray",
  denied: "red",
  ready: "gray",
  recording: "red",
  paused: "yellow",
  stopped: "green",
};

function AudioPreview({ blob }: { blob: Blob }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return src ? <audio controls src={src} /> : null;
}

export function AudioRecorder() {
  const { status, blob, duration, start, pause, resume, stop, reset, download } =
    useAudioRecorder();

  return (
    <Stack align="center" gap="md">
      <Group>
        <Badge color={STATUS_COLORS[status]} variant="filled" size="lg">
          {STATUS_LABELS[status]}
        </Badge>
        {(status === "recording" || status === "paused") && (
          <Text ff="monospace" size="lg">
            {formatDuration(duration)}
          </Text>
        )}
        {status === "stopped" && duration > 0 && (
          <Text ff="monospace" size="lg" c="dimmed">
            {formatDuration(duration)}
          </Text>
        )}
      </Group>

      {status === "denied" && (
        <Text c="red" size="sm" ta="center" maw={320}>
          Microphone access denied. Enable it in browser settings and reload.
        </Text>
      )}

      <Group>
        {(status === "idle" || status === "ready") && (
          <Button color="red" onClick={start}>
            Record
          </Button>
        )}
        {status === "recording" && (
          <>
            <Button color="yellow" onClick={pause}>
              Pause
            </Button>
            <Button color="gray" variant="outline" onClick={stop}>
              Stop
            </Button>
          </>
        )}
        {status === "paused" && (
          <>
            <Button color="red" onClick={resume}>
              Resume
            </Button>
            <Button color="gray" variant="outline" onClick={stop}>
              Stop
            </Button>
          </>
        )}
        {status === "stopped" && (
          <>
            <Button color="blue" onClick={() => download()}>
              Save to Disk
            </Button>
            <Button color="gray" variant="outline" onClick={reset}>
              New Recording
            </Button>
          </>
        )}
      </Group>

      {status === "stopped" && blob && <AudioPreview blob={blob} />}
    </Stack>
  );
}
