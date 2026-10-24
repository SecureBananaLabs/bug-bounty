import { PrismaClient } from "@freelanceflow/db";

const prisma = new PrismaClient();

// ── Metrics ──────────────────────────────────────────────────────────────────

export async function getAdminMetrics() {
  const [totalUsers, activeJobs, openDisputes, flaggedListings, totalRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: "IN_PROGRESS" } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { isFlagged: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenue: totalRevenue._sum.amount ?? 0,
  };
}

// ── User Management ──────────────────────────────────────────────────────────

export async function listUsers({ page = 1, limit = 20, role, status, search }) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      postedJobs: { select: { id: true, title: true, status: true } },
      disputes: { select: { id: true, reason: true, status: true } },
      reviewsGot: {
        select: { id: true, rating: true, comment: true },
        take: 5,
      },
    },
  });
  if (!user) throw new Error("User not found");
  return user;
}

export async function updateUserStatus(userId, adminId, status) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });
  await prisma.auditLog.create({
    data: {
      adminId,
      action:
        status === "SUSPENDED"
          ? "USER_SUSPEND"
          : status === "BANNED"
            ? "USER_BAN"
            : "USER_REINSTATE",
      targetId: userId,
      details: `Status changed to ${status}`,
    },
  });
  return user;
}

// ── Job Moderation ───────────────────────────────────────────────────────────

export async function listFlaggedJobs({ page = 1, limit = 20 }) {
  const where = { isFlagged: true };
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);
  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function moderateJob(jobId, adminId, action, reason) {
  const statusMap = {
    approve: { isFlagged: false, moderationStatus: "APPROVED" },
    reject: { isFlagged: false, moderationStatus: "REJECTED" },
    escalate: { isFlagged: true, moderationStatus: "ESCALATED" },
  };
  const data = statusMap[action];
  if (!data) throw new Error(`Invalid moderation action: ${action}`);

  const job = await prisma.job.update({ where: { id: jobId }, data });

  await prisma.auditLog.create({
    data: {
      adminId,
      action: `JOB_${action.toUpperCase()}`,
      targetId: jobId,
      details: reason || `Job ${action}d`,
    },
  });

  // Notify the posting user
  await prisma.notification.create({
    data: {
      userId: job.clientId,
      title: `Job ${action}d`,
      body: reason || `Your job posting has been ${action}d by an admin.`,
    },
  });

  return job;
}

// ── Dispute Resolution ───────────────────────────────────────────────────────

export async function listDisputes({ page = 1, limit = 20, status }) {
  const where = status ? { status } : {};
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true } },
        client: { select: { id: true, fullName: true } },
      },
    }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDisputeDetail(disputeId) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      job: true,
      client: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  return dispute;
}

export async function resolveDispute(disputeId, adminId, ruling, resolution) {
  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "RESOLVED", resolution, adminId },
  });

  await prisma.auditLog.create({
    data: {
      adminId,
      action: "DISPUTE_RULING",
      targetId: disputeId,
      details: ruling,
    },
  });

  // Notify both parties
  await prisma.notification.createMany({
    data: [
      {
        userId: dispute.clientId,
        title: "Dispute Resolved",
        body: resolution,
      },
      {
        userId: dispute.freelancerId,
        title: "Dispute Resolved",
        body: resolution,
      },
    ],
  });

  return dispute;
}

// ── Platform Controls ────────────────────────────────────────────────────────

export async function getPlatformConfig() {
  const configs = await prisma.platformConfig.findMany();
  const result = {};
  for (const c of configs) result[c.key] = c.value === "true";
  return {
    allowRegistration: result.allowRegistration ?? true,
    allowJobPosting: result.allowJobPosting ?? true,
  };
}

export async function updatePlatformConfig(key, value, adminId) {
  const boolValue = String(value);
  await prisma.platformConfig.upsert({
    where: { key },
    create: { key, value: boolValue },
    update: { value: boolValue },
  });

  await prisma.auditLog.create({
    data: {
      adminId,
      action:
        key === "allowRegistration"
          ? "TOGGLE_REGISTRATION"
          : "TOGGLE_JOB_POSTING",
      details: `${key} set to ${boolValue}`,
    },
  });

  return { key, value };
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export async function listAuditLogs({ page = 1, limit = 50, adminId, action, fromDate, toDate }) {
  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Trust Score Distribution ─────────────────────────────────────────────────

export async function getTrustScoreDistribution() {
  const users = await prisma.user.findMany({
    include: { reviewsGot: { select: { rating: true } } },
  });

  const distribution = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  for (const user of users) {
    if (user.reviewsGot.length === 0) {
      distribution["0-20"]++;
      continue;
    }
    const avg =
      user.reviewsGot.reduce((sum, r) => sum + r.rating, 0) /
      user.reviewsGot.length;
    const score = Math.round((avg / 5) * 100);
    if (score <= 20) distribution["0-20"]++;
    else if (score <= 40) distribution["21-40"]++;
    else if (score <= 60) distribution["41-60"]++;
    else if (score <= 80) distribution["61-80"]++;
    else distribution["81-100"]++;
  }

  return distribution;
}
