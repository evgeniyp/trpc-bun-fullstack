# Audio Recorder (Bun + React)

Browser-based voice recorder full stack app.

## Prerequisites

[bun.js](https://bun.com/)

## Setup

```sh
make install
make dev      # dev server with HMR on http://localhost:3000
```

Run `make` (or `make help`) to list all targets.

## Architecture

Single Bun process serves both frontend and backend.

Bun bundles `index.html` on the fly in dev (HMR) and serves it.

Static assets (MP3 worker, LAME library, favicon) live in `static/` and are served via a fetch fallback.

```
server/index.ts         Bun.serve — API routes + index.html + static/
client/index.tsx        React entry, MantineProvider, ErrorBoundary

client/AudioRecorder    Top-level component wiring hooks + UI

client/hooks/           useAudioStream, useMediaRecorder, useTranscribe,
                        useAudioVisualizer, useRecordingTimer, useBeforeUnloadGuard
client/components/      Waveform, ClipList, RecordControls, modals, TranscriptBox
client/consts/          audioConfig — bitrate, mime selection, memory budget

static/                 lame.min.js + mp3-encoder.worker.js (off-main-thread MP3)
```

## Sources

- I took the [MediaStream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API) as an example of how to work with media in modern browsers

## Assumptions

- I didn't want depend on external libraries, so I kept the default mp3 player and replicated waveform render similar to MDN example.

- I ask mic permission on page load, not when the actual recordings starts. This makes recording start process much more smooth for the user.

- I set up bitrates assuming we will record voice, not studio sound. Mono channel, browser recording bitrate is 128 Kbit, mp3 bitrate is 65 Kbit (saving to mp3 requires transcoding).

- When saving to mp3 I use the separate worker process in order not to block the UI. It's served as a static script.

- I added artificial delays (3 seconds) to transcribing and transcoding scripts in order to show transitional states.



## Stack

- [Bun](https://bun.sh) — runtime, bundler, package manager
- [React 19](https://react.dev) + [Mantine](https://mantine.dev) — UI, dark mode default
- [lamejs](https://github.com/zhuker/lamejs) — MP3 encoding in Web Worker
- [Biome](https://biomejs.dev) — lint + format
