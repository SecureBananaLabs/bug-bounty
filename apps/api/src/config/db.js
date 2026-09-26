import { getDb } from "./prisma.js";

export async function connectDb() {
  const db = getDb();

  if (typeof db.$connect === "function") {
    await db.$connect();
  }

  return { connected: true, driver: "prisma" };
}
