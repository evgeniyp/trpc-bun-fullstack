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

// 128 kbps source gives headroom when re-encoding to MP3; Opus/AAC at this rate is near-lossless for voice.
export const RECORDING_BITRATE_BPS = 128_000;
export const RECORDING_BYTES_PER_SEC = RECORDING_BITRATE_BPS / 8;

export const RECORDER_OPTIONS: MediaRecorderOptions = {
  ...(supportedMimeType ? { mimeType: supportedMimeType } : {}),
  audioBitsPerSecond: RECORDING_BITRATE_BPS,
};

// 64 kbps mono MP3 is transparent for voice; drop to 48 kbps to reduce file size.
export const MP3_BITRATE_KBPS = 64;

// Memory budget sized for 4 hours at current bitrate: 4 * 3600 * RECORDING_BYTES_PER_SEC.
export const MEMORY_BUDGET_BYTES = 4 * 3600 * RECORDING_BYTES_PER_SEC; // ~220 MB

// How often MediaRecorder fires ondataavailable during recording.
// Drives real-time usage updates; also determines chunk granularity.
export const RECORDING_TIMESLICE_MS = 500;
