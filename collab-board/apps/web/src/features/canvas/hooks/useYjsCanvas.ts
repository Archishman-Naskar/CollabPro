"use client";

// apps/web/src/features/canvas/hooks/useYjsCanvas.ts

import { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { useYjs } from "@/lib/yjs/provider";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tool = "pencil" | "line" | "rect" | "circle" | "eraser";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  points: StrokePoint[];
  color: string;
  width: number;
  timestamp: number;
  userId: string;
}

export interface CanvasSize {
  width: number;
  height: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 900;
const EXPAND_H = 400;
const EXPAND_V = 300;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useYjsCanvas(userId: string) {
  const { ydoc, isAuthenticated } = useYjs();

  // Shared Yjs structures — stable references from ydoc
  const strokesArray = ydoc.getArray<Stroke>("strokes");
  const canvasSizeMap = ydoc.getMap<number>("canvasSize");

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  // ── Initialise UndoManager & observers ───────────────────────────────────
  useEffect(() => {
    // Seed canvas size once (no-op if already set by another client)
    if (!canvasSizeMap.has("width")) {
      ydoc.transact(() => {
        canvasSizeMap.set("width", DEFAULT_WIDTH);
        canvasSizeMap.set("height", DEFAULT_HEIGHT);
      });
    }

    // UndoManager scoped to this user's transactions only.
    // We use the userId string as the transaction origin so the manager
    // only undoes strokes that this user added via ydoc.transact(fn, userId).
    const undoManager = new Y.UndoManager(strokesArray, {
      trackedOrigins: new Set([userId]),
    });
    undoManagerRef.current = undoManager;

    const syncStrokes = () => setStrokes(strokesArray.toArray());
    const syncSize = () =>
      setCanvasSize({
        width: canvasSizeMap.get("width") ?? DEFAULT_WIDTH,
        height: canvasSizeMap.get("height") ?? DEFAULT_HEIGHT,
      });

    strokesArray.observe(syncStrokes);
    canvasSizeMap.observe(syncSize);

    // Hydrate immediately
    syncStrokes();
    syncSize();

    return () => {
      strokesArray.unobserve(syncStrokes);
      canvasSizeMap.unobserve(syncSize);
      undoManager.destroy();
      undoManagerRef.current = null;
    };
    // userId is stable per session; ydoc is stable for the room lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ydoc, userId]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** Push a completed stroke into the shared array. */
  const addStroke = useCallback(
    (stroke: Stroke) => {
      ydoc.transact(() => {
        strokesArray.push([stroke]);
      }, userId); // origin = userId → UndoManager will track it
    },
    [ydoc, userId, strokesArray]
  );

  /** Undo the most recent stroke this user added. */
  const undoStroke = useCallback(() => {
    undoManagerRef.current?.undo();
  }, []);

  /**
   * Clear every stroke on the canvas.
   * Only ADMINs should be permitted to call this; the caller must enforce RBAC.
   */
  const clearCanvas = useCallback(() => {
    ydoc.transact(() => {
      if (strokesArray.length > 0) {
        strokesArray.delete(0, strokesArray.length);
      }
    });
  }, [ydoc, strokesArray]);

  /** Expand the canvas width or height — synced to all users. */
  const expandCanvas = useCallback(
    (direction: "horizontal" | "vertical") => {
      ydoc.transact(() => {
        if (direction === "horizontal") {
          canvasSizeMap.set(
            "width",
            (canvasSizeMap.get("width") ?? DEFAULT_WIDTH) + EXPAND_H
          );
        } else {
          canvasSizeMap.set(
            "height",
            (canvasSizeMap.get("height") ?? DEFAULT_HEIGHT) + EXPAND_V
          );
        }
      });
    },
    [ydoc, canvasSizeMap]
  );

  return {
    strokes,
    canvasSize,
    addStroke,
    undoStroke,
    clearCanvas,
    expandCanvas,
    isAuthenticated,
  };
}