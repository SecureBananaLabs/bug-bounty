import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { assertJwtSecret } from "../utils/jwt.js";

export const prisma = new PrismaClient();

export async function connectDb() {
  assertJwtSecret();
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL must be configured before the API can start");
  }

  await prisma.$connect();
  return prisma;
}
