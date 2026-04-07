"use client";

// apps/web/src/features/canvas/hooks/useCanvas.ts

import { useCallback, useRef } from "react";
import { useYjs } from "@/lib/yjs/provider";
import type { Stroke, StrokePoint, Tool } from "./useYjsCanvas";

// ─── Constants ────────────────────────────────────────────────────────────────

export const CANVAS_BG = "#ffffff";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Convert a mouse event position from screen-space to canvas logical coordinates,
 * accounting for CSS scaling of the canvas element.
 */
export function getCanvasPoint(
  canvas: HTMLCanvasElement,
  e: MouseEvent | React.MouseEvent
): StrokePoint {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/** Render a single stroke onto a 2D canvas context. */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  const { tool, points, color, width } = stroke;
  if (points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  switch (tool) {
    case "pencil":
    case "eraser": {
      if (points.length === 1) {
        // Single dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          // Smooth with midpoints
          const mx = (points[i - 1].x + points[i].x) / 2;
          const my = (points[i - 1].y + points[i].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, mx, my);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
      break;
    }

    case "line": {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      break;
    }

    case "rect": {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.strokeRect(
        start.x,
        start.y,
        end.x - start.x,
        end.y - start.y
      );
      break;
    }

    case "circle": {
      const start = points[0];
      const end = points[points.length - 1];
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      if (rx > 0 && ry > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Redraw the entire canvas from scratch using the committed stroke list.
 * Call this whenever the Yjs strokes array changes.
 */
export function renderAllStrokes(
  canvas: HTMLCanvasElement,
  strokes: Stroke[]
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear to white (canvas background)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    renderStroke(ctx, stroke);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tool: Tool;
  color: string;
  brushSize: number;
  canWrite: boolean;
  userId: string;
  onStrokeComplete: (stroke: Stroke) => void;
  /** Called on every mousemove so the parent can render the preview stroke. */
  onPreviewUpdate: (preview: Stroke | null) => void;
}

export function useCanvas({
  canvasRef,
  tool,
  color,
  brushSize,
  canWrite,
  userId,
  onStrokeComplete,
  onPreviewUpdate,
}: UseCanvasOptions) {
  const { awareness } = useYjs();
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<StrokePoint[]>([]);
  const strokeIdRef = useRef<string>("");

  // ── Awareness cursor ──────────────────────────────────────────────────────

  const updateCursor = useCallback(
    (x: number, y: number) => {
      awareness?.setLocalStateField("cursor", { x, y });
    },
    [awareness]
  );

  const clearCursor = useCallback(() => {
    awareness?.setLocalStateField("cursor", null);
  }, [awareness]);

  // ── Build a live Stroke object from current state ─────────────────────────

  const buildPreviewStroke = useCallback(
    (points: StrokePoint[]): Stroke => ({
      id: strokeIdRef.current,
      tool,
      points,
      color: tool === "eraser" ? CANVAS_BG : color,
      width: tool === "eraser" ? brushSize * 3 : brushSize,
      timestamp: Date.now(),
      userId,
    }),
    [tool, color, brushSize, userId]
  );

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canWrite || !canvasRef.current) return;
      isDrawingRef.current = true;
      strokeIdRef.current = generateId();
      const point = getCanvasPoint(canvasRef.current, e);
      pointsRef.current = [point];
      onPreviewUpdate(buildPreviewStroke([point]));
    },
    [canWrite, canvasRef, onPreviewUpdate, buildPreviewStroke]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const point = getCanvasPoint(canvasRef.current, e);
      updateCursor(point.x, point.y);

      if (!isDrawingRef.current || !canWrite) return;

      // For shape tools (line/rect/circle) we only need start + current end
      if (tool === "pencil" || tool === "eraser") {
        pointsRef.current.push(point);
      } else {
        pointsRef.current = [pointsRef.current[0], point];
      }

      onPreviewUpdate(buildPreviewStroke(pointsRef.current));
    },
    [canWrite, canvasRef, tool, updateCursor, onPreviewUpdate, buildPreviewStroke]
  );

  const commitStroke = useCallback(() => {
    if (!isDrawingRef.current || !canWrite) return;
    isDrawingRef.current = false;

    const points = pointsRef.current;
    if (points.length > 0) {
      onStrokeComplete(buildPreviewStroke(points));
    }

    pointsRef.current = [];
    onPreviewUpdate(null);
  }, [canWrite, onStrokeComplete, buildPreviewStroke, onPreviewUpdate]);

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      commitStroke();
    },
    [commitStroke]
  );

  const handleMouseLeave = useCallback(() => {
    clearCursor();
    commitStroke(); // finalise any in-progress stroke
  }, [clearCursor, commitStroke]);

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
}