import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export const prisma = new PrismaClient();

async function seedDb() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) return;

    console.log("Seeding database with default records for the admin panel...");

    const category = await prisma.category.upsert({
      where: { name: 'Development' },
      update: {},
      create: { name: 'Development', description: 'Software and web development' }
    });

    const client = await prisma.user.create({
      data: {
        email: 'client1@example.com',
        fullName: 'Alice Client',
        passwordHash: 'hashedpassword',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@freelanceflow.com',
        fullName: 'System Administrator',
        passwordHash: 'adminpassword123',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    const freelancer = await prisma.user.create({
      data: {
        email: 'free1@example.com',
        fullName: 'Bob Freelancer',
        passwordHash: 'hashedpassword',
        role: 'FREELANCER',
        status: 'ACTIVE'
      }
    });

    const suspendedUser = await prisma.user.create({
      data: {
        email: 'spammer@example.com',
        fullName: 'Spammy McSpam',
        passwordHash: 'hashedpassword',
        role: 'CLIENT',
        status: 'SUSPENDED'
      }
    });

    const bannedUser = await prisma.user.create({
      data: {
        email: 'badguy@example.com',
        fullName: 'Scammer Joe',
        passwordHash: 'hashedpassword',
        role: 'FREELANCER',
        status: 'BANNED'
      }
    });

    const job1 = await prisma.job.create({
      data: {
        title: 'Build React Dashboard',
        description: 'Need a modern, sleek dashboard.',
        budgetMin: 500,
        budgetMax: 1000,
        status: 'OPEN',
        moderationStatus: 'APPROVED',
        clientId: client.id,
        categoryId: category.id
      }
    });

    const job2 = await prisma.job.create({
      data: {
        title: 'Scam people online',
        description: 'Earn $1000/day doing nothing!',
        budgetMin: 1000,
        budgetMax: 5000,
        status: 'OPEN',
        moderationStatus: 'FLAGGED',
        clientId: suspendedUser.id,
        categoryId: category.id
      }
    });

    const job3 = await prisma.job.create({
      data: {
        title: 'Write SEO Articles',
        description: 'Need 10 high quality articles.',
        budgetMin: 50,
        budgetMax: 100,
        status: 'OPEN',
        moderationStatus: 'APPROVED',
        clientId: client.id,
        categoryId: category.id
      }
    });

    await prisma.dispute.create({
      data: {
        jobId: job1.id,
        clientId: client.id,
        freelancerId: freelancer.id,
        reason: 'Freelancer did not complete milestones.',
        status: 'OPEN'
      }
    });

    await prisma.platformSettings.create({
      data: {
        registrationsEnabled: true,
        jobPostingsEnabled: true
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId: 'admin_test',
        action: 'UPDATE_USER_STATUS',
        targetType: 'USER',
        targetId: suspendedUser.id,
        details: JSON.stringify({ status: 'SUSPENDED' })
      }
    });

    console.log("Database seeded successfully.");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  }
}

export async function connectDb() {
  try {
    await prisma.$connect();
    await seedDb();
    return { connected: true, driver: "prisma" };
  } catch (err) {
    console.warn("Prisma connection failed (DATABASE_URL not set or unreachable). Falling back to in-memory/mock mode.", err.message);
    return { connected: false, driver: "offline-mock" };
  }
}
