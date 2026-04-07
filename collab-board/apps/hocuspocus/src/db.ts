import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

export interface Membership {
  memberId: string;
  roomId: string;
  role: "ADMIN" | "MEMBER";
  canWrite: boolean;
  canVideo: boolean;
}

export async function getRoomMembership(
  userId: string,
  roomCode: string
): Promise<Membership | null> {
  const result = await sql`
    SELECT 
      rm.id as "memberId",
      rm."roomId",
      rm.role,
      rm."canWrite",
      rm."canVideo"
    FROM "RoomMember" rm
    JOIN "Room" r ON r.id = rm."roomId"
    WHERE rm."userId" = ${userId} 
      AND r.code = ${roomCode}
  `;
  return (result[0] as Membership) ?? null;
}

export async function loadYjsDocument(
  roomCode: string
): Promise<Buffer | null> {
  const result = await sql`
    SELECT "yjsDocument" 
    FROM "Room" 
    WHERE code = ${roomCode}
  `;
  if (!result[0] || !result[0].yjsDocument) return null;
  return result[0].yjsDocument as Buffer;
}

export async function storeYjsDocument(
  roomCode: string,
  state: Uint8Array
): Promise<void> {
  const buffer = Buffer.from(state);
  await sql`
    UPDATE "Room" 
    SET "yjsDocument" = ${buffer} 
    WHERE code = ${roomCode}
  `;
}

//collab-board\apps\hocuspocus\src\db.ts