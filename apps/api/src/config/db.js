import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

let prismaClient;

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

export async function connectDb({ databaseUrl = env.databaseUrl, client } = {}) {
  if (!databaseUrl) {
    return {
      connected: false,
      driver: "prisma",
      skipped: true,
      reason: "DATABASE_URL is not configured"
    };
  }

  const dbClient = client ?? getPrismaClient();
  await dbClient.$connect();

  return { connected: true, driver: "prisma" };
}
