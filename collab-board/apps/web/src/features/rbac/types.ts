export interface Member {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  canWrite: boolean;
  canVideo: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}