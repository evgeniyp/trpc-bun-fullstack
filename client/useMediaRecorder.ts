import { useEffect, useRef, useState } from "react";
import { MEMORY_BUDGET_BYTES, RECORDER_OPTIONS, RECORDING_TIMESLICE_MS } from "./audioConfig";

export type Clip = {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
};

export function useMediaRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream, RECORDER_OPTIONS);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        setUsedBytes((n) => n + e.data.size);
      }
    };

    recorder.onpause = () => setIsPaused(true);
    recorder.onresume = () => setIsPaused(false);

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      chunksRef.current = [];
      const url = URL.createObjectURL(blob);
      setClips((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          url,
          name: "Unnamed clip",
          size: blob.size,
          mimeType: recorder.mimeType,
        },
      ]);
      setIsRecording(false);
      setIsPaused(false);
    };

    return () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    if (usedBytes >= MEMORY_BUDGET_BYTES) {
      const state = recorderRef.current?.state;
      if (state === "recording" || state === "paused") recorderRef.current?.stop();
    }
  }, [usedBytes]);

  // Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      setClips((prev) => {
        prev.forEach((c) => {
          URL.revokeObjectURL(c.url);
        });
        return prev;
      });
    };
  }, []);

  const start = () => {
    if (recorderRef.current?.state === "inactive") {
      recorderRef.current.start(RECORDING_TIMESLICE_MS);
      setIsRecording(true);
    }
  };

  const stop = () => {
    const state = recorderRef.current?.state;
    if (state === "recording" || state === "paused") {
      recorderRef.current?.stop();
    }
  };

  const pause = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
    }
  };

  const deleteClip = (id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip) {
        URL.revokeObjectURL(clip.url);
        setUsedBytes((n) => n - clip.size);
      }
      return prev.filter((c) => c.id !== id);
    });
  };

  const renameClip = (id: string, name: string) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  return {
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
  };
}
