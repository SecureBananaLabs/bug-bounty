import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Users ────────────────────────────────────────────
export async function listUsers({ page = 1, limit = 20, role, status, search }) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, fullName: true, role: true, status: true, isVerified: true, createdAt: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function setUserStatus(userId, status) {
  const user = await prisma.user.update({ where: { id: userId }, data: { status } });
  return user;
}

// ─── Job Moderation ────────────────────────────────────
export async function listFlaggedJobs({ page = 1, limit = 20 }) {
  const where = { moderationStatus: "PENDING" };
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { client: { select: { id: true, fullName: true, email: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where }),
  ]);
  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function moderateJob(jobId, status, reason) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { moderationStatus: status, flaggedReason: reason || null },
  });
  if (status === "REJECTED" && reason) {
    const jobWithClient = await prisma.job.findUnique({ where: { id: jobId }, select: { clientId: true } });
    if (jobWithClient) {
      await prisma.notification.create({
        data: {
          userId: jobWithClient.clientId,
          title: "Job listing rejected",
          body: `Your job "${job.title}" was rejected. Reason: ${reason}`,
        },
      });
    }
  }
  return job;
}

// ─── Disputes ──────────────────────────────────────────
export async function listDisputes({ page = 1, limit = 20, status }) {
  const where = {};
  if (status) where.status = status;
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: {
        initiator: { select: { id: true, fullName: true } },
        respondent: { select: { id: true, fullName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDispute(disputeId) {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      initiator: { select: { id: true, fullName: true, email: true } },
      respondent: { select: { id: true, fullName: true, email: true } },
    },
  });
}

export async function resolveDispute(disputeId, resolution, adminId) {
  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "RESOLVED", resolution, resolvedById: adminId, resolvedAt: new Date() },
  });
  await prisma.notification.createMany({
    data: [
      { userId: dispute.initiatorId, title: "Dispute resolved", body: `Dispute #${dispute.id} has been resolved.` },
      { userId: dispute.respondentId, title: "Dispute resolved", body: `Dispute #${dispute.id} has been resolved.` },
    ],
  });
  return dispute;
}

// ─── Metrics / Dashboard ──────────────────────────────
export async function getDashboardMetrics() {
  const [totalUsers, activeJobs, openDisputes, flaggedJobs, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.job.count({ where: { moderationStatus: "PENDING" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
  ]);
  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedJobs,
    revenue: revenue._sum.amount || 0,
    trustDistribution: {}, // placeholder for chart data
  };
}

// ─── Platform Settings ────────────────────────────────
export async function getSettings() {
  let settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: { id: "default", allowRegistration: true, allowJobPosting: true },
    });
  }
  return settings;
}

export async function updateSettings(updates, adminId) {
  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: updates,
    create: { id: "default", ...updates },
  });
  return settings;
}

// ─── Audit Log ─────────────────────────────────────────
export async function writeAuditLog({ adminId, action, entityType, entityId, details }) {
  return prisma.auditLog.create({
    data: { adminId, action, entityType, entityId, details },
  });
}

export async function listAuditLogs({ page = 1, limit = 50, adminId, action }) {
  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { admin: { select: { id: true, fullName: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
