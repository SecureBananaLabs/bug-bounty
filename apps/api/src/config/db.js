import { env } from "./env.js";

export async function connectDb() {
  const databaseUrl = (process.env.DATABASE_URL ?? env.databaseUrl).trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to the database");
  }

  // TODO: wire Prisma client from @freelanceflow/db package
  return { connected: true, driver: "prisma-placeholder" };
}
