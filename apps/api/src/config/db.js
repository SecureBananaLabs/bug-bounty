import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Connects to the database using Prisma and returns the Prisma client instance.
 *
 * @returns {Promise<PrismaClient>} The connected Prisma client.
 * @throws Will throw an error if the connection fails.
 */
export async function connectDb() {
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
  }
}
