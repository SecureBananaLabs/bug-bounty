import { PrismaClient } from "@freelanceflow/db";

export const prisma = new PrismaClient();

export async function connectDb() {
  try {
    await prisma.$connect();
    return { connected: true, driver: "prisma" };
  } catch (err) {
    console.error("Failed to connect to database via Prisma client:", err);
    return { connected: false, error: err.message };
  }
}
