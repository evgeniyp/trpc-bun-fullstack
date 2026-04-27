import { useState } from "react";

export type TranscribeState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "waiting" }
  | { status: "done"; text: string }
  | { status: "error"; message: string };

export function useTranscribe(clipUrl: string) {
  const [state, setState] = useState<TranscribeState>({ status: "idle" });

  const handle = async () => {
    setState({ status: "uploading", progress: 0 });
    try {
      const audioBlob = await fetch(clipUrl).then((r) => r.blob());
      const form = new FormData();
      form.append("audio", audioBlob, "clip");

      const text = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          setState({ status: "uploading", progress: e.lengthComputable ? e.loaded / e.total : 0 });
        };
        xhr.upload.onload = () => {
          setState({ status: "waiting" });
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve((JSON.parse(xhr.responseText) as { text?: string }).text ?? "");
            } catch {
              reject(new Error("Invalid server response"));
            }
          } else {
            reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Server unavailable"));
        xhr.open("POST", "/api/transcribe");
        xhr.send(form);
      });

      setState({ status: "done", text });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Server unavailable",
      });
    }
  };

  const isActive = state.status === "uploading" || state.status === "waiting";

  return { state, handle, isActive };
}
