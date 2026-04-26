import { Mp3Encoder } from "@breezystack/lamejs";
import { MP3_BITRATE_KBPS } from "./audioConfig";
import type { Clip } from "./useMediaRecorder";

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

function mimeToExt(mimeType: string): string {
  const base = mimeType.split(";")[0].trim();
  return MIME_TO_EXT[base] ?? "audio";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function floatToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

async function encodeToMp3(blob: Blob, sampleRate: number): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate });
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  // Mix down to mono: average all channels
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < channelCount; c++) {
    const channel = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      mono[i] += channel[i] / channelCount;
    }
  }

  const samples = floatToInt16(mono);
  const encoder = new Mp3Encoder(1, audioBuffer.sampleRate, MP3_BITRATE_KBPS);
  const mp3Chunks: Int8Array[] = [];
  const FRAME = 1152;

  for (let i = 0; i < samples.length; i += FRAME) {
    const chunk = samples.subarray(i, i + FRAME);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length > 0) mp3Chunks.push(encoded);
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) mp3Chunks.push(flushed);

  return new Blob(mp3Chunks, { type: "audio/mpeg" });
}

export async function saveClip(clip: Clip, format: "original" | "mp3") {
  if (format === "original") {
    const response = await fetch(clip.url);
    const blob = await response.blob();
    triggerDownload(blob, `${clip.name}.${mimeToExt(clip.mimeType)}`);
    return;
  }

  const response = await fetch(clip.url);
  const sourceBlob = await response.blob();
  const mp3Blob = await encodeToMp3(sourceBlob, 44100);
  triggerDownload(mp3Blob, `${clip.name}.mp3`);
}
