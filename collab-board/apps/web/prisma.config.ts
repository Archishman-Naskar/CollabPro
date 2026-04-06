import * as dotenv from "dotenv";
import type { PrismaConfig } from "prisma";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies PrismaConfig;