import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

// POST /api/rooms/[roomId]/token
// Returns a fresh Hocuspocus JWT for the calling user based on current DB permissions.
// Called by the client after it detects a permissionVersion bump in the Yjs doc.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
    include: { room: { select: { code: true } } },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this room." },
      { status: 403 }
    );
  }

  const canWrite = membership.role === "ADMIN" || membership.canWrite;
  const canVideo = membership.role === "ADMIN" || membership.canVideo;

  const token = jwt.sign(
    {
      userId: session.user.id,
      roomCode: membership.room.code,
      role: membership.role,
      canWrite,
      canVideo,
    },
    process.env.AUTH_SECRET!,
    { expiresIn: "12h" }
  );

  return NextResponse.json({
    token,
    membership: {
      role: membership.role,
      canWrite,
      canVideo,
    },
  });
}