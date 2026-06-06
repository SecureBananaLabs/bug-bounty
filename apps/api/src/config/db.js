import { PrismaClient } from "@freelanceflow/db";

const prisma = new PrismaClient();

export async function connectDb() {
  try {
    await prisma.$connect();
    return { connected: true, driver: "prisma" };
  } catch (error) {
    return { connected: false, error };
  }
}
