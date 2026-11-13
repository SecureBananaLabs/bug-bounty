import { PrismaClient } from "@prisma/client";

// Singleton Prisma client - one instance per process, reused across requests.
export const prisma = new PrismaClient();

export async function connectDb() {
  await prisma.$connect();
  return { connected: true, driver: "prisma" };
}
