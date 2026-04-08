"use client";
// collab-board/apps/web/src/features/boards/components/TextBoard.tsx

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { useYjs } from "@/lib/yjs/provider";
import type { TextBoard } from "../types";

interface TextBoardProps {
  board: TextBoard;
  canWrite: boolean;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function TextBoard({
  board,
  canWrite,
  onMove,
  onDelete,
  onRename,
}: TextBoardProps) {
  const { ydoc } = useYjs();

  // Local drag-position state for smooth dragging.
  // Synced back to Yjs on mouse-up so all users see the final position.
  const [pos, setPos] = useState(board.position);
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [localName, setLocalName] = useState(board.name);

  const isDraggingRef = useRef(false);
  const dragOriginRef = useRef({ mouseX: 0, mouseY: 0, boardX: 0, boardY: 0 });

  // Sync position when another user moves this board
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPos(board.position);
    }
  }, [board.position]);

  // Sync name from Yjs (another user might rename)
  useEffect(() => {
    setLocalName(board.name);
  }, [board.name]);

  // TipTap editor — one instance per board, sharing the board's Yjs XmlFragment.
  // StarterKit history is disabled because Yjs manages the document history.
  // The Collaboration extension calls ydoc.getXmlFragment("board-<id>") internally.
  const editor = useEditor({
    immediatelyRender:false,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc, field: `board-${board.id}` }),
    ],
    editable: canWrite,
    editorProps: {
      attributes: {
        class: "collabboard-editor",
      },
    },
  });

  // Keep editable state in sync when canWrite changes (e.g. after permission update)
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(canWrite);
    }
  }, [editor, canWrite]);

  // Destroy editor on unmount (TipTap should handle this, but be explicit)
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // ── Drag logic ────────────────────────────────────────────────────────────

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (!canWrite) return;
    // Don't drag if the user is clicking the title input
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    e.preventDefault(); // prevent text selection during drag

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
      onMove(board.id, finalPos); // sync to Yjs
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // ── Title rename commit ───────────────────────────────────────────────────

  const commitRename = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== board.name) {
      onRename(board.id, trimmed);
    } else {
      setLocalName(board.name); // revert if empty
    }
    setIsRenamingTitle(false);
  };

  return (
    <div
      className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: 320,
        minHeight: 160,
        maxHeight: 400,
        zIndex: 20,
        // Prevent the board from creating a stacking context that breaks drag
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
        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wide flex-shrink-0">
          TEXT
        </span>

        {isRenamingTitle && canWrite ? (
          <input
            autoFocus
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setLocalName(board.name);
                setIsRenamingTitle(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 text-sm font-semibold text-gray-700 bg-white border border-blue-400 rounded px-1 focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-gray-700 truncate"
            onDoubleClick={() => canWrite && setIsRenamingTitle(true)}
            title={canWrite ? "Double-click to rename" : board.name}
          >
            {board.name}
          </span>
        )}

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

      {/* ── TipTap editor area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-2 text-gray-800 text-sm">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="text-gray-400 text-xs">Loading editor…</div>
        )}
      </div>
    </div>
  );
}