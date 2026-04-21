import { useEffect, useRef, useState } from "react";

const PING_INTERVAL_MS = 1000;
const PONG_TIMEOUT_MS = 2500;
const RECONNECT_MIN_MS = 500;
const RECONNECT_MAX_MS = 10_000;

export function useConnection() {
  const [online, setOnline] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(RECONNECT_MIN_MS);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;

    const clearTimers = () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (pongTimer.current) clearTimeout(pongTimer.current);
      pingTimer.current = null;
      pongTimer.current = null;
    };

    const scheduleReconnect = () => {
      if (stopped.current) return;
      const delay = backoff.current;
      backoff.current = Math.min(backoff.current * 2, RECONNECT_MAX_MS);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    const markOffline = () => {
      setOnline(false);
      clearTimers();
      try {
        wsRef.current?.close();
      } catch {}
    };

    function connect() {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setOnline(true);
        backoff.current = RECONNECT_MIN_MS;

        pingTimer.current = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          ws.send("ping");
          if (pongTimer.current) clearTimeout(pongTimer.current);
          pongTimer.current = setTimeout(() => {
            markOffline();
            scheduleReconnect();
          }, PONG_TIMEOUT_MS);
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (e) => {
        if (e.data === "pong" && pongTimer.current) {
          clearTimeout(pongTimer.current);
          pongTimer.current = null;
        }
      };

      ws.onclose = () => {
        markOffline();
        scheduleReconnect();
      };

      ws.onerror = () => {
        markOffline();
      };
    }

    connect();

    return () => {
      stopped.current = true;
      clearTimers();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return online;
}
