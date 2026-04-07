import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/rooms/[roomId]/last-accessed — update lastAccessed timestamp
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  await prisma.roomMember.updateMany({
    where: { userId: session.user.id, roomId },
    data: { lastAccessed: new Date() },
  });

  return NextResponse.json({ success: true });
}