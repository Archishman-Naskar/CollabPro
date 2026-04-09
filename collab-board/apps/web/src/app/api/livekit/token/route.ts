import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccessToken } from "livekit-server-sdk";

// POST /api/livekit/token
// Body: { roomId: string }
// Returns a LiveKit access token for the calling user.
// canPublish and canSubscribe are derived from the user's canVideo permission.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured on this server." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { roomId } = body as { roomId?: string };

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }

  // Fetch membership to get room code and canVideo permission
  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
    include: {
      room: { select: { code: true } },
      user: { select: { name: true } },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this room." },
      { status: 403 }
    );
  }

  const canVideo = membership.role === "ADMIN" || membership.canVideo;

  // LiveKit room name = the room's 20-char code (same as Hocuspocus document name)
  const livekitRoomName = membership.room.code;
  const participantName =
    membership.user.name ?? session.user.email ?? session.user.id;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: participantName,
    ttl: "12h",
  });

  at.addGrant({
    room: livekitRoomName,
    roomJoin: true,
    canPublish: canVideo,        // only canVideo users can publish audio/video
    canSubscribe: true,      // only canVideo users can receive others' streams
    canPublishData: false,
  });

  const token = await at.toJwt();

  return NextResponse.json({ token, canVideo });
}