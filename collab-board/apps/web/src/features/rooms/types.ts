export type RoomRole = "ADMIN" | "MEMBER";

export interface Room {
  id: string;
  code: string;
  name: string;
  role: RoomRole;
  canWrite: boolean;
  canVideo: boolean;
  lastAccessed: string;
  joinedAt: string;
  memberCount: number;
  isOwner: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}