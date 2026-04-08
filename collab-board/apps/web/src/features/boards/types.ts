// collab-board/apps/web/src/features/boards/types.ts

export interface BoardPosition {
  x: number;
  y: number;
}

export interface TextBoard {
  id: string;
  type: "text";
  position: BoardPosition;
  name: string;
  createdBy: string;
  createdAt: number;
}

export interface ImageBoard {
  id: string;
  type: "image";
  position: BoardPosition;
  name: string;
  src: string; // Cloudinary URL
  createdBy: string;
}