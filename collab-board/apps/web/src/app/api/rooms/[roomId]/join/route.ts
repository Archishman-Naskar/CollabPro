import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { joinRoomLimiter, applyRateLimit } from "@/lib/ratelimit";

// POST /api/rooms/[roomId]/join — join a room by code
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 joins per hour
  const { limited, response } = await applyRateLimit(
    joinRoomLimiter,
    `join_room:${session.user.id}`
  );
  if (limited) return response!;

  const { roomId } = await params;

  // roomId here is actually the room CODE (20-char)
  const room = await prisma.room.findUnique({ where: { code: roomId } });

  if (!room) {
    return NextResponse.json(
      { error: "Room not found. Check the code and try again." },
      { status: 404 }
    );
  }

  // Check if already a member
  const existingMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: { userId: session.user.id, roomId: room.id },
    },
  });

  if (existingMember) {
    // Just update lastAccessed and return
    await prisma.roomMember.update({
      where: { id: existingMember.id },
      data: { lastAccessed: new Date() },
    });

    return NextResponse.json({
      room: { id: room.id, code: room.code, name: room.name },
      membership: existingMember,
      alreadyMember: true,
    });
  }

  // New member — default to view-only
  const membership = await prisma.roomMember.create({
    data: {
      userId: session.user.id,
      roomId: room.id,
      role: "MEMBER",
      canWrite: false,
      canVideo: false,
    },
  });

  return NextResponse.json({
    room: { id: room.id, code: room.code, name: room.name },
    membership,
    alreadyMember: false,
  });
}