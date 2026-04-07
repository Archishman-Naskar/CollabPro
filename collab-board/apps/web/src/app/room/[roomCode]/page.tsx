import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { roomCode } = await params;

  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) redirect("/home");

  // Update lastAccessed
  await prisma.roomMember.updateMany({
    where: { userId: session.user.id, roomId: room.id },
    data: { lastAccessed: new Date() },
  });

  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
        <p className="text-gray-400 font-mono text-sm">{room.code}</p>
        <p className="text-gray-500 mt-2">
          Your role:{" "}
          <span className="text-blue-400 font-semibold">
            {membership?.role ?? "Not a member"}
          </span>
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Whiteboard canvas coming in Phase 3.
        </p>
      </div>
      <a
        href="/home"
        className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
      >
        ← Back to Dashboard
      </a>
    </div>
  );
}