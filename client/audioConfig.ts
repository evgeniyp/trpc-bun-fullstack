// Voice recording: mono channel reduces file size and is sufficient for speech.
// Echo/noise cancellation handled by browser before MediaRecorder sees the data.
export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

// Preferred order: Opus/WebM (Chrome/Firefox) → MP4/AAC (Safari) → browser default.
const VOICE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4"];
const supportedMimeType = VOICE_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));

// 32 kbps mono Opus/AAC is transparent for speech; drop to 16 kbps to halve size.
export const RECORDER_OPTIONS: MediaRecorderOptions = {
  ...(supportedMimeType ? { mimeType: supportedMimeType } : {}),
  audioBitsPerSecond: 32_000,
};
