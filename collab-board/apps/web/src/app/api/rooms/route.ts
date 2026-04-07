import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createRoomLimiter, applyRateLimit } from "@/lib/ratelimit";

const createRoomSchema = z.object({
  code: z
    .string()
    .length(20)
    .regex(/^[a-zA-Z0-9]{20}$/, "Invalid room code format"),
  name: z.string().min(1).max(100).optional().default("Untitled Room"),
});

// GET /api/rooms — list all rooms the user is a member of
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.roomMember.findMany({
    where: { userId: session.user.id },
    include: {
      room: {
        include: {
          owner: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { lastAccessed: "desc" },
  });

  const rooms = memberships.map((m) => ({
    id: m.room.id,
    code: m.room.code,
    name: m.room.name,
    role: m.role,
    canWrite: m.canWrite,
    canVideo: m.canVideo,
    lastAccessed: m.lastAccessed,
    joinedAt: m.joinedAt,
    memberCount: m.room._count.members,
    owner: m.room.owner,
    isOwner: m.room.ownerId === session.user.id,
    createdAt: m.room.createdAt,
  }));

  return NextResponse.json({ rooms });
}

// POST /api/rooms — create a new room
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 room creations per hour
  const { limited, response } = await applyRateLimit(
    createRoomLimiter,
    `create_room:${session.user.id}`
  );
  if (limited) return response!;

  try {
    const body = await req.json();
    const { code, name } = createRoomSchema.parse(body);

    // Check if room code already exists
    const existing = await prisma.room.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Room code already exists. Please generate a new one." },
        { status: 409 }
      );
    }

    // Create room + add creator as ADMIN member in a transaction
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          code,
          name,
          ownerId: session.user.id,
        },
      });

      await tx.roomMember.create({
        data: {
          userId: session.user.id,
          roomId: newRoom.id,
          role: "ADMIN",
          canWrite: true,
          canVideo: true,
        },
      });

      return newRoom;
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[CREATE_ROOM_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create room." },
      { status: 500 }
    );
  }
}