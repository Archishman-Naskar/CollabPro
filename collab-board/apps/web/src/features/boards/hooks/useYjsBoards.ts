"use client";
// collab-board/apps/web/src/features/boards/hooks/useYjsBoards.ts

import { useEffect, useState, useCallback } from "react";
import { useYjs } from "@/lib/yjs/provider";
import type { TextBoard, BoardPosition } from "../types";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useYjsBoards(userId: string, canWrite: boolean) {
  const { ydoc } = useYjs();
  // Y.Map that stores TextBoard plain objects, keyed by board id.
  // ydoc.getMap() always returns the same stable instance.
  const boardsMap = ydoc.getMap<TextBoard>("boards");

  const [boards, setBoards] = useState<TextBoard[]>([]);

  useEffect(() => {
    const update = () => {
      setBoards(Array.from(boardsMap.values()));
    };
    boardsMap.observe(update);
    update(); // seed initial state
    return () => {
      boardsMap.unobserve(update);
    };
  }, [boardsMap]);

  const addBoard = useCallback(
    (name: string) => {
      if (!canWrite) return;
      const id = generateId();
      const board: TextBoard = {
        id,
        type: "text",
        // Stagger new boards slightly so they don't all land on top of each other
        position: { x: 80 + (boardsMap.size % 5) * 20, y: 80 + (boardsMap.size % 5) * 20 },
        name,
        createdBy: userId,
        createdAt: Date.now(),
      };
      boardsMap.set(id, board);
    },
    [boardsMap, canWrite, userId]
  );

  const moveBoard = useCallback(
    (id: string, position: BoardPosition) => {
      if (!canWrite) return;
      const board = boardsMap.get(id);
      if (!board) return;
      boardsMap.set(id, { ...board, position });
    },
    [boardsMap, canWrite]
  );

  const renameBoard = useCallback(
    (id: string, name: string) => {
      if (!canWrite) return;
      const board = boardsMap.get(id);
      if (!board) return;
      boardsMap.set(id, { ...board, name });
    },
    [boardsMap, canWrite]
  );

  const deleteBoard = useCallback(
    (id: string) => {
      if (!canWrite) return;
      boardsMap.delete(id);
      // Note: the associated Y.XmlFragment ("board-<id>") cannot be deleted from
      // the ydoc, but it will be empty and harmless after the board is removed.
    },
    [boardsMap, canWrite]
  );

  return { boards, addBoard, moveBoard, renameBoard, deleteBoard };
}