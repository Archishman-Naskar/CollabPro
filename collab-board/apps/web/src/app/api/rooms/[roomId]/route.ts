import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100),
});

// PATCH /api/rooms/[roomId] — rename a room
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  // Only admins can rename
  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
  });

  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name } = patchSchema.parse(body);

    const room = await prisma.room.update({
      where: { id: roomId },
      data: { name },
    });

    return NextResponse.json({ room });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to rename room." },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[roomId] — delete a room (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  if (room.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the room owner can delete it." },
      { status: 403 }
    );
  }

  await prisma.room.delete({ where: { id: roomId } });

  return NextResponse.json({ success: true });
}