import { useMantineTheme } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";

interface WaveformProps {
  source: MediaStream | HTMLAudioElement | null;
  color: string;
  paused?: boolean;
  height?: number;
}

export function Waveform({ source, color, paused = false, height = 60 }: WaveformProps) {
  const theme = useMantineTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cssWidth, setCssWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setCssWidth(Math.max(100, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [cssWidth, height]);

  useAudioVisualizer(canvasRef, source, color, paused);

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 600 }}>
      <canvas ref={canvasRef} style={{ border: `1px solid ${theme.colors.gray[7]}` }} />
    </div>
  );
}
