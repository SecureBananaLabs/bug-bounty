// apps/api/src/config/db.js

import { prisma } from '@freelanceflow/db';

/**
 * Establishes a connection to the database using the Prisma client
 * exported from the `@freelanceflow/db` package.
 *
 * @returns {Promise<{ connected: boolean, driver: import('@prisma/client').PrismaClient | null }>}
 *   An object indicating whether the connection was successful and the Prisma client instance.
 */
export async function connectDb() {
  try {
    // Ensure the Prisma client is connected
    await prisma.$connect();
    return { connected: true, driver: prisma };
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    return { connected: false, driver: null };
  }
}
