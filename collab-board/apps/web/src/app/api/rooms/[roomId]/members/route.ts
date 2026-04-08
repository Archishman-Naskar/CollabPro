import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/rooms/[roomId]/members — list all members (any room member)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  // Verify caller is a member of this room
  const caller = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
  });

  if (!caller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.roomMember.findMany({
    where: { roomId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      canWrite: m.canWrite,
      canVideo: m.canVideo,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
  });
}

// POST /api/rooms/[roomId]/members — bulk permission update (admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  const caller = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
  });

  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body as { action: string };

  type UpdateData = { canWrite?: boolean; canVideo?: boolean };
  const actionMap: Record<string, UpdateData> = {
    grant_write: { canWrite: true },
    revoke_write: { canWrite: false },
    grant_video: { canVideo: true },
    revoke_video: { canVideo: false },
  };

  const update = actionMap[action];
  if (!update) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  // Only update MEMBER-role users — ADMINs always have full access
  await prisma.roomMember.updateMany({
    where: { roomId, role: "MEMBER" },
    data: update,
  });

  return NextResponse.json({ success: true });
}