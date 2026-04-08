import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import RoomClient from "./RoomClient";

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { roomCode } = await params;

  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) redirect("/home?error=room-not-found");

  const membership = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: { userId: session.user.id, roomId: room.id },
    },
  });

  if (!membership) redirect("/home?error=not-a-member");

  await prisma.roomMember.update({
    where: { id: membership!.id },
    data: { lastAccessed: new Date() },
  });

  const canWrite = membership!.role === "ADMIN" || membership!.canWrite;
  const canVideo = membership!.role === "ADMIN" || membership!.canVideo;

  const hocuspocusToken = jwt.sign(
    {
      userId: session.user.id,
      roomCode,
      role: membership!.role,
      canWrite,
      canVideo,
    },
    process.env.AUTH_SECRET!,
    { expiresIn: "12h" }
  );

  return (
    <RoomClient
      roomCode={roomCode}
      roomId={room.id}          // ← NEW
      roomName={room.name}
      token={hocuspocusToken}
      user={{
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
      membership={{ role: membership!.role, canWrite, canVideo }}
    />
  );
}