import { useEffect, useRef, useState } from "react";

export function useRecordingTimer(isRecording: boolean, isPaused: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const segmentStartRef = useRef(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      accumulatedRef.current = 0;
      return;
    }
    if (isPaused) {
      accumulatedRef.current += Date.now() - segmentStartRef.current;
      return;
    }
    segmentStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(accumulatedRef.current + (Date.now() - segmentStartRef.current));
    }, 100);
    return () => { clearInterval(id); };
  }, [isRecording, isPaused]);

  return elapsed;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
