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

  // Find room
  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) redirect("/home?error=room-not-found");

  // Check membership
  const membership = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: { userId: session.user.id, roomId: room.id },
    },
  });

  if (!membership) {
    // Not a member — redirect home with a message
    redirect("/home?error=not-a-member");
  }

  // Update lastAccessed
  await prisma.roomMember.update({
    where: { id: membership.id },
    data: { lastAccessed: new Date() },
  });

  const canWrite = membership.role === "ADMIN" || membership.canWrite;
  const canVideo = membership.role === "ADMIN" || membership.canVideo;

  // Generate a short-lived token for Hocuspocus
  const hocuspocusToken = jwt.sign(
    {
      userId: session.user.id,
      roomCode,
      role: membership.role,
      canWrite,
      canVideo,
    },
    process.env.AUTH_SECRET!,
    { expiresIn: "12h" }
  );

  return (
    <RoomClient
      roomCode={roomCode}
      roomName={room.name}
      token={hocuspocusToken}
      user={{
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
      membership={{ role: membership.role, canWrite, canVideo }}
    />
  );
}