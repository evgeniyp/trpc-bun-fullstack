import { type RefObject, useEffect, useRef } from "react";

export function useAudioVisualizer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  source: MediaStream | HTMLAudioElement | null,
  color: string,
  paused = false,
) {
  const colorRef = useRef(color);
  colorRef.current = color;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFlatLine = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = colorRef.current;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    if (!source) {
      drawFlatLine();
      return;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 16384;

    const stream =
      source instanceof HTMLAudioElement
        ? (source as HTMLMediaElement & { captureStream(): MediaStream }).captureStream()
        : source;

    audioCtx.createMediaStreamSource(stream).connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);
    let rafId = 0;
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      rafId = requestAnimationFrame(draw);
      if (pausedRef.current) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      analyser.getByteTimeDomainData(dataArray as unknown as Uint8Array<ArrayBuffer>);

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = colorRef.current;
      ctx.beginPath();

      const sliceWidth = width / analyser.fftSize;
      let x = 0;
      for (let i = 0; i < analyser.fftSize; i++) {
        const v = (dataArray[i] ?? 128) / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      audioCtx.close().then(() => {
        drawFlatLine();
      });
    };
  }, [source, canvasRef]);
}
