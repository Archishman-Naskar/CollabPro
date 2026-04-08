import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  canWrite: z.boolean().optional(),
  canVideo: z.boolean().optional(),
});

// PATCH /api/rooms/[roomId]/members/[memberId] — update one member's permissions (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId, memberId } = await params;

  // Must be an admin of this room
  const caller = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
  });

  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Confirm the target member belongs to this room
  const target = await prisma.roomMember.findFirst({
    where: { id: memberId, roomId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  // Admins always have full permissions — block any attempt to change them
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot modify permissions for an Admin." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }

    const updated = await prisma.roomMember.update({
      where: { id: memberId },
      data,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[MEMBER_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update member." },
      { status: 500 }
    );
  }
}