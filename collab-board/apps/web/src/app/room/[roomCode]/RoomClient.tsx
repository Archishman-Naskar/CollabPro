"use client";

import { YjsProvider } from "@/lib/yjs/provider";
import RoomShell from "./RoomShell";

interface RoomClientProps {
  roomCode: string;
  roomName: string;
  token: string;
  user: { id: string; name: string | null; image: string | null };
  membership: { role: string; canWrite: boolean; canVideo: boolean };
}

export default function RoomClient({
  roomCode,
  roomName,
  token,
  user,
  membership,
}: RoomClientProps) {
  return (
    <YjsProvider roomCode={roomCode} token={token} user={user}>
      <RoomShell
        roomCode={roomCode}
        roomName={roomName}
        user={user}
        membership={membership}
      />
    </YjsProvider>
  );
}