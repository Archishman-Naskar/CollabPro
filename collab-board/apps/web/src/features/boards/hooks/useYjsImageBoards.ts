"use client";
// collab-board/apps/web/src/features/boards/hooks/useYjsImageBoards.ts

import { useEffect, useState, useCallback } from "react";
import { useYjs } from "@/lib/yjs/provider";
import type { ImageBoard, BoardPosition } from "../types";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useYjsImageBoards(userId: string, canWrite: boolean) {
  const { ydoc } = useYjs();
  const imageBoardsMap = ydoc.getMap<ImageBoard>("imageBoards");

  const [imageBoards, setImageBoards] = useState<ImageBoard[]>([]);

  useEffect(() => {
    const update = () => {
      setImageBoards(Array.from(imageBoardsMap.values()));
    };
    imageBoardsMap.observe(update);
    update();
    return () => {
      imageBoardsMap.unobserve(update);
    };
  }, [imageBoardsMap]);

  const addImageBoard = useCallback(
    (name: string, src: string) => {
      if (!canWrite) return;
      const id = generateId();
      const board: ImageBoard = {
        id,
        type: "image",
        position: { x: 100 + (imageBoardsMap.size % 5) * 20, y: 100 + (imageBoardsMap.size % 5) * 20 },
        name,
        src,
        createdBy: userId,
      };
      imageBoardsMap.set(id, board);
    },
    [imageBoardsMap, canWrite, userId]
  );

  const moveImageBoard = useCallback(
    (id: string, position: BoardPosition) => {
      if (!canWrite) return;
      const board = imageBoardsMap.get(id);
      if (!board) return;
      imageBoardsMap.set(id, { ...board, position });
    },
    [imageBoardsMap, canWrite]
  );

  const deleteImageBoard = useCallback(
    (id: string) => {
      if (!canWrite) return;
      imageBoardsMap.delete(id);
    },
    [imageBoardsMap, canWrite]
  );

  return { imageBoards, addImageBoard, moveImageBoard, deleteImageBoard };
}