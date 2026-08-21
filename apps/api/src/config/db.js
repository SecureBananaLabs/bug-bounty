import { PrismaClient } from "@prisma/client";

let prisma;

export async function connectDb() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    await prisma.$connect();
  }
  return prisma;
}
