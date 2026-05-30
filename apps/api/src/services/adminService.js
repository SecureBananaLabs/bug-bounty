import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Metrics
export async function getAdminMetrics() {
  const [openJobs, activeFreelancers, flaggedAccounts, monthlyVolume, totalUsers, totalJobs, totalProposals] =
    await Promise.all([
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { role: "FREELANCER", isVerified: true } }),
      prisma.user.count({ where: { role: { not: "ADMIN" }, isVerified: false } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      prisma.user.count(),
      prisma.job.count(),
      prisma.proposal.count(),
    ]);

  return {
    openJobs,
    activeFreelancers,
    flaggedAccounts,
    monthlyVolume: monthlyVolume._sum.amount ?? 0,
    totalUsers,
    totalJobs,
    totalProposals,
  };
}

// Users
export async function getAllUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true, _count: { select: { postedJobs: true, proposals: true } } },
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { postedJobs: true, proposals: true, reviewsGiven: true, reviewsGot: true },
  });
}

export async function suspendUser(id) {
  // In a real system you'd have an isActive field; here we flag isVerified=false as suspended
  return prisma.user.update({ where: { id }, data: { isVerified: false } });
}

export async function activateUser(id) {
  return prisma.user.update({ where: { id }, data: { isVerified: true } });
}

// Jobs
export async function getAllJobs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, fullName: true, email: true } }, _count: { select: { proposals: true } } },
    }),
    prisma.job.count(),
  ]);
  return { jobs, total, page, totalPages: Math.ceil(total / limit) };
}

export async function flagJob(id) {
  // Could add a flag field; using status CANCELLED as placeholder
  return prisma.job.update({ where: { id }, data: { status: "CANCELLED" } });
}

// Audit Logs
export async function createAuditLog({ userId, action, entityType, entityId, metadata }) {
  return prisma.auditLog.create({
    data: { userId, action, entityType, entityId, metadata },
  });
}

export async function getAuditLogs(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

// Disputes
export async function createDispute({ jobId, raisedById, reason }) {
  return prisma.dispute.create({ data: { jobId, raisedById, reason, status: "OPEN" } });
}

export async function getDisputes(page = 1, limit = 20, status) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true, budgetMin: true, budgetMax: true } },
        raisedBy: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, total, page, totalPages: Math.ceil(total / limit) };
}

export async function resolveDispute(id, { resolution, adminId }) {
  return prisma.dispute.update({
    where: { id },
    data: { status: "RESOLVED", resolution, resolvedById: adminId, resolvedAt: new Date() },
  });
}

export async function getDisputeById(id) {
  return prisma.dispute.findUnique({
    where: { id },
    include: {
      job: { include: { client: true, proposals: true } },
      raisedBy: true,
      resolvedBy: true,
    },
  });
}
