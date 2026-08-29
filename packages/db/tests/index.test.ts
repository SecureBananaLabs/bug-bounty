import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Client', () => {
  it('should connect to the database', async () => {
    const user = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
    expect(user).toBeDefined();
  });
});