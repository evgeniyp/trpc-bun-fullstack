importScripts("/lame.min.js");

const FRAME = 1152;

self.onmessage = function (e) {
  const { samples, sampleRate, bitrateKbps } = e.data;
  const encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrateKbps);
  const chunks = [];
  const total = samples.length;

  for (let i = 0; i < total; i += FRAME) {
    const encoded = encoder.encodeBuffer(samples.subarray(i, i + FRAME));
    if (encoded.length > 0)
      chunks.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength));
    if (i % (FRAME * 200) === 0) self.postMessage({ type: "progress", frac: i / total });
  }

  const flushed = encoder.flush();
  if (flushed.length > 0)
    chunks.push(new Uint8Array(flushed.buffer, flushed.byteOffset, flushed.byteLength));

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  self.postMessage({ type: "done", buffer: result.buffer }, [result.buffer]);
};
