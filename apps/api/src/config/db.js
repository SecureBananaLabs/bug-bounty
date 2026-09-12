import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function connectDb() {
  try {
    await prisma.$connect();
    return { connected: true, driver: "prisma", client: prisma };
  } catch (error) {
    console.error("Database connection failed:", error);
    return { connected: false, error };
  }
}
export { prisma };
