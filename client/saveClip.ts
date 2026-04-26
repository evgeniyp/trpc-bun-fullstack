import { Mp3Encoder } from "@breezystack/lamejs";
import { MP3_BITRATE_KBPS } from "./audioConfig";
import type { Clip } from "./useMediaRecorder";

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

type LameMp3Encoder = {
  encodeBuffer(samples: Int16Array): Uint8Array;
  flush(): Uint8Array;
};

function createEncoder(sampleRate: number, bitrateKbps: number): LameMp3Encoder {
  return new Mp3Encoder(1, sampleRate, bitrateKbps) as unknown as LameMp3Encoder;
}

function mimeToExt(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim() ?? "";
  return MIME_TO_EXT[base] ?? "audio";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}

function floatToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i] ?? 0));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

async function decodeToMonoSamples(
  blob: Blob,
): Promise<{ samples: Int16Array; sampleRate: number }> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelCount = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);
    for (let c = 0; c < channelCount; c++) {
      const channel = audioBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        mono[i] += channel[i] ?? 0;
      }
    }
    if (channelCount > 1) {
      const inv = 1 / channelCount;
      for (let i = 0; i < length; i++) mono[i] *= inv;
    }
    return { samples: floatToInt16(mono), sampleRate: audioBuffer.sampleRate };
  } finally {
    await audioCtx.close();
  }
}

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));

async function encodeToMp3(
  samples: Int16Array,
  sampleRate: number,
  onProgress?: (frac: number) => void,
): Promise<Blob> {
  const encoder = createEncoder(sampleRate, MP3_BITRATE_KBPS);
  const chunks: Uint8Array[] = [];
  const FRAME = 1152;
  const YIELD_EVERY = FRAME * 200;
  const total = samples.length;

  for (let i = 0; i < total; i += FRAME) {
    const chunk = samples.subarray(i, i + FRAME);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length > 0) chunks.push(encoded);
    if (i % YIELD_EVERY === 0) {
      onProgress?.(i / total);
      await yieldToUi();
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(flushed);
  onProgress?.(1);

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

export async function saveClip(
  clip: Clip,
  format: "original" | "mp3",
  onProgress?: (frac: number) => void,
) {
  const response = await fetch(clip.url);
  const sourceBlob = await response.blob();

  if (format === "original") {
    triggerDownload(sourceBlob, `${clip.name}.${mimeToExt(clip.mimeType)}`);
    return;
  }

  const { samples, sampleRate } = await decodeToMonoSamples(sourceBlob);
  const mp3Blob = await encodeToMp3(samples, sampleRate, onProgress);
  triggerDownload(mp3Blob, `${clip.name}.mp3`);
}
