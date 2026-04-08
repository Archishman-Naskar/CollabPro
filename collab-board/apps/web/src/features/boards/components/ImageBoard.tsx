"use client";
// collab-board/apps/web/src/features/boards/components/ImageBoard.tsx

import { useEffect, useRef, useState } from "react";
import type { ImageBoard } from "../types";

interface ImageBoardProps {
  board: ImageBoard;
  canWrite: boolean;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
}

export default function ImageBoard({
  board,
  canWrite,
  onMove,
  onDelete,
}: ImageBoardProps) {
  const [pos, setPos] = useState(board.position);
  const [imgError, setImgError] = useState(false);

  const isDraggingRef = useRef(false);
  const dragOriginRef = useRef({ mouseX: 0, mouseY: 0, boardX: 0, boardY: 0 });

  // Sync position from Yjs when another user moves the board
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPos(board.position);
    }
  }, [board.position]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (!canWrite) return;
    e.preventDefault();

    isDraggingRef.current = true;
    dragOriginRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boardX: pos.x,
      boardY: pos.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragOriginRef.current.mouseX;
      const dy = ev.clientY - dragOriginRef.current.mouseY;
      setPos({
        x: Math.max(0, dragOriginRef.current.boardX + dx),
        y: Math.max(0, dragOriginRef.current.boardY + dy),
      });
    };

    const handleMouseUp = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const dx = ev.clientX - dragOriginRef.current.mouseX;
      const dy = ev.clientY - dragOriginRef.current.mouseY;
      const finalPos = {
        x: Math.max(0, dragOriginRef.current.boardX + dx),
        y: Math.max(0, dragOriginRef.current.boardY + dy),
      };
      setPos(finalPos);
      onMove(board.id, finalPos);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: 300,
        zIndex: 20,
        contain: "layout",
      }}
    >
      {/* ── Title bar (drag handle) ────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0 select-none ${
          canWrite ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        onMouseDown={handleTitleBarMouseDown}
      >
        <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wide flex-shrink-0">
          IMG
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-700 truncate">
          {board.name}
        </span>
        {canWrite && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(board.id)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors text-xs"
            title="Delete board"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Image area ────────────────────────────────────────────────────── */}
      <div className="bg-gray-50">
        {imgError ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
            Failed to load image
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={board.src}
            alt={board.name}
            className="w-full h-auto max-h-64 object-contain block"
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}