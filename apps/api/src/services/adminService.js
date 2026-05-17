import { prisma } from "../../../packages/db/src/index.js";

const PAGE_SIZE = 20;

async function logAudit(action, targetId, targetType, adminId, details = null) {
  await prisma.auditLog.create({
    data: { action, targetId, targetType, adminId, details },
  });
}

export async function getAdminMetrics() {
  const [totalUsers, activeJobs, openDisputes, flaggedJobs, recentPayments] =
    await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.job.count({ where: { isFlagged: true } }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amount: true },
      }),
    ]);

  const totalRevenue = recentPayments._sum.amount || 0;

  const trustScoreBuckets = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedJobs,
    currentPeriodRevenue: totalRevenue,
    trustScoreBuckets,
  };
}

export async function listUsers({ page = 1, role, status, search }) {
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            postedJobs: true,
            proposals: true,
            reviewsGot: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize: PAGE_SIZE };
}

export async function updateUserStatus(userId, status, adminId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, fullName: true, status: true },
  });

  const actionMap = {
    SUSPENDED: "SUSPEND_USER",
    BANNED: "BAN_USER",
    ACTIVE: "REINSTATE_USER",
  };
  await logAudit(actionMap[status], userId, "User", adminId, `Status set to ${status}`);
  return user;
}

export async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      bio: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true,
      postedJobs: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: { id: true, title: true, status: true, createdAt: true },
      },
      disputesAsFreelancer: {
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        select: { id: true, status: true, jobId: true, createdAt: true },
      },
      disputesAsClient: {
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        select: { id: true, status: true, jobId: true, createdAt: true },
      },
    },
  });
  if (!user) throw new Error("User not found");
  return user;
}

export async function listFlaggedJobs({ page = 1, status }) {
  const where = { isFlagged: true };
  if (status === "pending") {
    where.flagReason = { not: null };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        flagReason: true,
        isFlagged: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { id: true, email: true, fullName: true } },
        _count: { select: { proposals: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page, pageSize: PAGE_SIZE };
}

export async function updateJobFlag(jobId, action, adminId) {
  const updateData =
    action === "approve"
      ? { isFlagged: false, flagReason: null }
      : action === "escalate"
      ? { isFlagged: true }
      : { isFlagged: false, flagReason: null, status: "CANCELLED" };

  const job = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
    select: { id: true, title: true, isFlagged: true, status: true },
  });

  const actionMap = { approve: "APPROVE_JOB", reject: "REJECT_JOB", escalate: "ESCALATE_JOB" };
  await logAudit(actionMap[action], jobId, "Job", adminId);
  return job;
}

export async function sendJobRejectionNotice(jobId, reason) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { clientId: true, title: true },
  });
  if (!job) return;
  await prisma.notification.create({
    data: {
      userId: job.clientId,
      title: "Your job listing was rejected",
      body: `Your job "${job.title}" was rejected. Reason: ${reason}`,
    },
  });
}

export async function listDisputes({ page = 1, status }) {
  const where = {};
  if (status) where.status = status;

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        ruling: true,
        createdAt: true,
        updatedAt: true,
        job: { select: { id: true, title: true, budgetMax: true } },
        freelancerId: true,
        clientId: true,
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  return { disputes, total, page, pageSize: PAGE_SIZE };
}

export async function getDisputeDetail(disputeId) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      job: {
        include: {
          payments: true,
          proposals: true,
        },
      },
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  return dispute;
}

export async function resolveDispute(disputeId, action, ruling, reason, adminId) {
  let rulingValue = ruling || null;
  let disputeStatus = "RESOLVED";

  if (action === "ESCALATE") {
    rulingValue = null;
    disputeStatus = "UNDER_REVIEW";
  }

  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: disputeStatus,
      adminId,
      ruling: rulingValue,
      reason: reason || null,
    },
    select: { id: true, status: true, ruling: true, reason: true },
  });

  const actionMap = {
    RULE_FREELANCER: "RULE_FREELANCER",
    RULE_CLIENT: "RULE_CLIENT",
    TRIGGER_REFUND: "TRIGGER_REFUND",
    ESCALATE: "ESCALATE_JOB",
  };
  await logAudit(actionMap[action], disputeId, "Dispute", adminId, reason || null);

  const participantIds = await prisma.dispute
    .findUnique({ where: { id: disputeId }, select: { freelancerId: true, clientId: true } })
    .then((d) => [d.freelancerId, d.clientId]);

  const rulingText =
    action === "RULE_FREELANCER"
      ? "The dispute has been resolved in favor of the freelancer."
      : action === "RULE_CLIENT"
      ? "The dispute has been resolved in favor of the client."
      : action === "TRIGGER_REFUND"
      ? "A refund has been initiated for the disputed job."
      : "Your dispute has been escalated for further review.";

  await Promise.all(
    participantIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: "Dispute Update",
          body: rulingText,
        },
      })
    )
  );

  return dispute;
}

export async function listAuditLogs({ page = 1, adminId, action, startDate, endDate }) {
  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, email: true, fullName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize: PAGE_SIZE };
}

export async function getPlatformSettings() {
  const rows = await prisma.platformSetting.findMany();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  if (!("allowRegistration" in settings)) {
    settings.allowRegistration = true;
  }
  if (!("allowJobPosting" in settings)) {
    settings.allowJobPosting = true;
  }
  return settings;
}

export async function updatePlatformSetting(key, value, adminId) {
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  const action = key === "allowRegistration" ? "TOGGLE_REGISTRATION" : "TOGGLE_JOB_POSTING";
  await logAudit(action, key, "PlatformSetting", adminId, `Set to ${value}`);
  return { key, value };
}
