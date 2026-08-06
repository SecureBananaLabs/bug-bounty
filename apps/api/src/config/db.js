import { PrismaClient } from "@freelanceflow/db";

let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

export async function connectDb(client = getPrismaClient()) {
  await client.$connect();
  return { connected: true, driver: "prisma" };
}
