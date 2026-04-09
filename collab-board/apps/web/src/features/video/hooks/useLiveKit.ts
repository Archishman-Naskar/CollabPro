"use client";

import { useState, useCallback } from "react";

interface LiveKitTokenResult {
  token: string;
  canVideo: boolean;
}

export function useLiveKit(roomId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [canVideo, setCanVideo] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (): Promise<LiveKitTokenResult | null> => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get video token.");
      return { token: data.token, canVideo: data.canVideo };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join call.";
      setError(msg);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [roomId]);

  const joinCall = useCallback(async () => {
    const result = await fetchToken();
    if (!result) return;
    setToken(result.token);
    setCanVideo(result.canVideo);
    setIsJoined(true);
  }, [fetchToken]);

  const leaveCall = useCallback(() => {
    setToken(null);
    setIsJoined(false);
    setError(null);
  }, []);

  return { token, canVideo, isJoined, isFetching, error, joinCall, leaveCall };
}