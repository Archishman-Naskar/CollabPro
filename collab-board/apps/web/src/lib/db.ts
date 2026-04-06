import {PrismaClient} from "@prisma/client";
import {Pool} from "@neondatabase/serverless";
import {PrismaNeon} from "@prisma/adapter-neon";

const pool=new Pool({connectionString:process.env.DATABASE_URL});
const adapter = new PrismaNeon(pool as any);
const globalForPrisma=global as unknown as {prisma:PrismaClient};

export const prisma=globalForPrisma.prisma||new PrismaClient({
  adapter,
  log:process.env.NODE_ENV==="development"?["error","warn"]:["error"],
});

if(process.env.NODE_ENV!=="production") globalForPrisma.prisma=prisma;