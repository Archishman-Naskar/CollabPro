"use client";

import { useCallback, useRef, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Video,
  VideoOff,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLiveKit } from "../hooks/useLiveKit";

interface VideoPanelProps {
  roomId: string;
  canVideo: boolean; // from membership — controls whether the UI is shown at all
}

// Draggable state
interface DragState {
  isDragging: boolean;
  startMouseX: number;
  startMouseY: number;
  startPanelX: number;
  startPanelY: number;
}

export default function VideoPanel({ roomId, canVideo }: VideoPanelProps) {
  return <VideoPanelInner roomId={roomId} canPublish={canVideo} />;
}

function VideoPanelInner({ roomId, canPublish }: { roomId: string, canPublish: boolean }) {
  const { token, isJoined, isFetching, error, joinCall, leaveCall } =
    useLiveKit(roomId);

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 80 });

  const dragState = useRef<DragState>({
    isDragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startPanelX: 0,
    startPanelY: 0,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // ── Dragging ─────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only drag from the header bar, ignore button clicks inside header
      if ((e.target as HTMLElement).closest("button")) return;
      dragState.current = {
        isDragging: true,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPanelX: position.x,
        startPanelY: position.y,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragState.current.isDragging) return;
        const dx = ev.clientX - dragState.current.startMouseX;
        const dy = ev.clientY - dragState.current.startMouseY;
        setPosition({
          x: Math.max(0, dragState.current.startPanelX + dx),
          y: Math.max(0, dragState.current.startPanelY + dy),
        });
      };

      const onMouseUp = () => {
        dragState.current.isDragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [position]
  );

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  // ── Not joined yet ────────────────────────────────────────────────────────

  if (!isJoined) {
    return (
      <div
        ref={panelRef}
        className="fixed z-50 select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={joinCall}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            {isFetching ? "Joining…" : "Join Call"}
          </button>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/80 border border-red-800 px-3 py-1.5 rounded-lg max-w-52">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Joined — show video panel ─────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="fixed z-50 select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={`bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isMinimized ? "w-56 h-auto" : "w-80 h-96"
        }`}
      >
        {/* ── Drag handle / Header ──────────────────────────────────────── */}
        <div
          onMouseDown={handleMouseDown}
          className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-white">Live Call</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={leaveCall}
              className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors"
              title="Leave Call"
            >
              <VideoOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Video area ─────────────────────────────────────────────────── */}
        {!isMinimized && token && (
          <div className="flex-1 overflow-hidden">
            <LiveKitRoom
              serverUrl={livekitUrl}
              token={token}
              connect={true}
              audio={canPublish}
              video={canPublish}
              onDisconnected={leaveCall}
              style={{ height: "100%", background: "transparent" }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        )}

        {/* Minimized state: just the header is visible */}
        {isMinimized && (
          <div className="px-3 py-2 text-xs text-gray-500">
            Call active — click <Maximize2 className="w-3 h-3 inline" /> to
            expand
          </div>
        )}
      </div>
    </div>
  );
}