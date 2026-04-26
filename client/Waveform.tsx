import { useMantineTheme } from "@mantine/core";
import { useRef } from "react";
import { useAudioVisualizer } from "./useAudioVisualizer";

interface WaveformProps {
  source: MediaStream | HTMLAudioElement | null;
  color: string;
  paused?: boolean;
  width?: number;
  height?: number;
}

export function Waveform({
  source,
  color,
  paused = false,
  width = 600,
  height = 60,
}: WaveformProps) {
  const theme = useMantineTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAudioVisualizer(canvasRef, source, color, paused);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: `1px solid ${theme.colors.gray[7]}` }}
    />
  );
}
