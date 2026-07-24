export async function connectDb() {
  // TODO: wire Prisma client from @freelanceflow/db package
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required to connect to the database");
  }

  return { connected: true, driver: "prisma-placeholder" };
}
