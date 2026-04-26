import { useEffect, useState } from "react";
import { AUDIO_CONSTRAINTS } from "./audioConfig";

const stopTracks = (s: MediaStream | null) => {
  s?.getTracks().forEach((t) => {
    t.stop();
  });
};

export function useAudioStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      .getUserMedia({ audio: AUDIO_CONSTRAINTS })
      .then((s) => {
        if (active) {
          setStream(s);
          setError(null);
        } else {
          stopTracks(s);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      active = false;

      setStream((s) => {
        stopTracks(s);
        return null;
      });
    };
  }, []);

  return { stream, error };
}
