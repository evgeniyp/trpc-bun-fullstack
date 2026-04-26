# Implementation stages
- Set up a full-stack boilerplate (I got one already)
- Learn about browser audio interface on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API)
- Decision: request audio when user enter's the page. Less hassle when recording starts.
- Implemented [`useAudioStream.ts`](/client/useAudioStream.ts)
- Decision: set up reasonable sound quality settings in [`audioConfig.ts`](/client/audioConfig.ts)
- Implemented [`useMediaRecorder.ts`](/client/useMediaRecorder.ts)
