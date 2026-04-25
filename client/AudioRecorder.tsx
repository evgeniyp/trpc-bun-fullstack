import { Badge, Button, Group, Select, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";

interface PresetConfig {
  label: string;
  description: string;
  constraints: MediaTrackConstraints;
  bitrate: number;
}

const PRESETS: Record<string, PresetConfig> = {
  voice: {
    label: "Voice",
    description:
      "Optimized for speech — low bitrate, mono, noise suppression on. Best for calls, dictation, and interviews. Smallest file size.",
    constraints: {
      sampleRate: 16000,
      channelCount: 1,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    },
    bitrate: 32000,
  },
  standard: {
    label: "Standard",
    description:
      "Balanced quality for podcasts and general recordings. Mono, no processing, moderate bitrate. Good default for most use cases.",
    constraints: {
      sampleRate: 44100,
      channelCount: 1,
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    },
    bitrate: 64000,
  },
  high: {
    label: "High",
    description:
      "Full stereo at 48 kHz — studio-grade quality. Best for music, ambience, or archival recordings. Largest file size.",
    constraints: {
      sampleRate: 48000,
      channelCount: 2,
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    },
    bitrate: 128000,
  },
};

const PRESET_SELECT_DATA = Object.entries(PRESETS).map(([value, p]) => ({
  value,
  label: p.label,
}));

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
        if (result.state === "granted")
          setState((s) => ({ ...s, status: "ready" }));
        else if (result.state === "denied")
          setState((s) => ({ ...s, status: "denied" }));
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

  const start = useCallback(
    async (presetKey: string) => {
      const preset = PRESETS[presetKey];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: preset.constraints,
        });
        streamRef.current = stream;
        chunksRef.current = [];
        accumulatedRef.current = 0;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

        const recorder = new MediaRecorder(
          stream,
          mimeType
            ? { mimeType, audioBitsPerSecond: preset.bitrate }
            : { audioBitsPerSecond: preset.bitrate },
        );
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
    },
    [startTimer],
  );

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
  const [preset, setPreset] = useState("high");
  const { status, blob, duration, start, pause, resume, stop, reset, download } =
    useAudioRecorder();

  const active = status === "recording" || status === "paused";

  return (
    <Stack align="center" gap="md" w={340}>
      <Select
        label="Quality"
        data={PRESET_SELECT_DATA}
        value={preset}
        onChange={(v) => setPreset(v ?? "high")}
        disabled={active}
        allowDeselect={false}
        w="100%"
      />
      <Text size="sm" c="dimmed" ta="center" mih={40}>
        {PRESETS[preset].description}
      </Text>

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
        <Text c="red" size="sm" ta="center">
          Microphone access denied. Enable it in browser settings and reload.
        </Text>
      )}

      <Group>
        {(status === "idle" || status === "ready") && (
          <Button color="red" onClick={() => start(preset)}>
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
