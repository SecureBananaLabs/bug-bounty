async function createPrismaClient() {
  const { PrismaClient } = await import("@freelanceflow/db");
  return new PrismaClient();
}

export async function connectDb(client = null) {
  const prisma = client ?? await createPrismaClient();
  await prisma.$connect();

  return { connected: true, driver: "prisma" };
}
