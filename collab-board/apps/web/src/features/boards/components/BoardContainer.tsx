"use client";
// collab-board/apps/web/src/features/boards/components/BoardContainer.tsx

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Type, ImageIcon, Loader2 } from "lucide-react";
import { useYjsBoards } from "../hooks/useYjsBoards";
import { useYjsImageBoards } from "../hooks/useYjsImageBoards";
import TextBoard from "./TextBoard";
import ImageBoard from "./ImageBoard";

interface BoardContainerProps {
  userId: string;
  canWrite: boolean;
}

export default function BoardContainer({ userId, canWrite }: BoardContainerProps) {
  const { boards, addBoard, moveBoard, renameBoard, deleteBoard } =
    useYjsBoards(userId, canWrite);
  const { imageBoards, addImageBoard, moveImageBoard, deleteImageBoard } =
    useYjsImageBoards(userId, canWrite);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Add text board ────────────────────────────────────────────────────────

  const handleAddTextBoard = () => {
    // window.prompt is synchronous and acceptable for an MVP name input.
    const name = window.prompt("Board name:", "Untitled");
    if (!name?.trim()) return;
    addBoard(name.trim());
  };

  // ── Add image board ───────────────────────────────────────────────────────

  const handleAddImageBoard = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again later
    if (e.target) e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 4 MB.");
      return;
    }

    // Use filename (without extension) as the default board name
    const defaultName = file.name.replace(/\.[^.]+$/, "") || "Image";

    setIsUploading(true);
    const uploadToast = toast.loading("Uploading image…");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      addImageBoard(defaultName, data.url);
      toast.success("Image board added!", { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || "Upload failed.", { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    // pointer-events-none on the container so mouse events pass through to the canvas.
    // Individual boards and the FAB buttons use pointer-events-auto.
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
      {/* ── Floating Action Buttons (canWrite only) ──────────────────────── */}
      {canWrite && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={handleAddTextBoard}
            title="Add Text Board"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors"
          >
            <Type className="w-3.5 h-3.5" />
            Text Board
          </button>

          <button
            onClick={handleAddImageBoard}
            disabled={isUploading}
            title="Add Image Board"
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
            Image Board
          </button>

          {/* Hidden file input — triggered by the Image Board button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Text Boards ───────────────────────────────────────────────────── */}
      {boards.map((board) => (
        // pointer-events-auto so the board itself captures mouse events
        <div key={board.id} className="pointer-events-auto">
          <TextBoard
            board={board}
            canWrite={canWrite}
            onMove={moveBoard}
            onDelete={deleteBoard}
            onRename={renameBoard}
          />
        </div>
      ))}

      {/* ── Image Boards ──────────────────────────────────────────────────── */}
      {imageBoards.map((board) => (
        <div key={board.id} className="pointer-events-auto">
          <ImageBoard
            board={board}
            canWrite={canWrite}
            onMove={moveImageBoard}
            onDelete={deleteImageBoard}
          />
        </div>
      ))}
    </div>
  );
}