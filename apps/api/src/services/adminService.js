import { prisma } from "../config/db.js";

// Access & Auth Middleware for API Protection
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
  }
  next();
}

// 1. Audit Logging Service
export async function logAdminAction(adminId, action, details) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details
      }
    });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
}

// 2. Trust & Metrics Dashboard API
export async function getAdminMetrics() {
  const users = await prisma.user.findMany();
  const jobs = await prisma.job.findMany();
  const disputes = await prisma.dispute.findMany();

  const totalUsers = users.length;
  const activeJobs = jobs.filter(j => j.status === "OPEN" || j.status === "IN_PROGRESS").length;
  const openDisputes = disputes.filter(d => d.status === "OPEN" || d.status === "UNDER_REVIEW").length;
  const flaggedListings = jobs.filter(j => j.status === "FLAGGED").length;

  // Let's compute a mockup total revenue or transaction volume: e.g. sum of all budgets of active/completed jobs * 0.1 (10% fee)
  const revenue = jobs.reduce((acc, job) => acc + (job.budgetMin + job.budgetMax) / 2, 0) * 0.15;

  // Trust score distribution (e.g. mock scores count)
  // Let's group users into ranges of trust score
  const trustScores = [
    { range: "0-20", count: users.filter(u => u.status === "BANNED").length },
    { range: "21-40", count: users.filter(u => u.status === "SUSPENDED").length },
    { range: "41-60", count: 0 },
    { range: "61-80", count: users.filter(u => u.status === "ACTIVE" && !u.isVerified).length },
    { range: "81-100", count: users.filter(u => u.status === "ACTIVE" && u.isVerified).length }
  ];

  return {
    summary: {
      totalUsers,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue
    },
    trustDistribution: trustScores
  };
}

// 3. User Management Service
export async function listAllUsers(filters) {
  const { search, role, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) {
    where.role = role;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { fullName: { contains: search } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit
  });

  const total = await prisma.user.count({ where });

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function updateUserStatus(adminId, userId, status) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      title: `Account Status Updated`,
      body: `Your account status has been updated to ${status} by an administrator.`
    }
  });

  await logAdminAction(adminId, `USER_${status}`, `Updated status of user ${user.email} (${userId}) to ${status}`);
  return user;
}

// 4. Job & Listing Moderation
export async function listFlaggedJobs() {
  return prisma.job.findMany({
    where: { status: "FLAGGED" }
  });
}

export async function moderateJob(adminId, jobId, action, reason) {
  let status = "OPEN";
  if (action === "APPROVE") status = "OPEN";
  else if (action === "REJECT") status = "REJECTED";
  else if (action === "ESCALATE") status = "FLAGGED"; // stay in moderation queue / flagged

  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status }
  });

  if (action === "REJECT") {
    // Notify posting user with reason
    await prisma.notification.create({
      data: {
        userId: job.clientId,
        title: `Job Listing Rejected`,
        body: `Your job listing "${job.title}" has been rejected. Reason: ${reason}`
      }
    });
  } else if (action === "APPROVE") {
    await prisma.notification.create({
      data: {
        userId: job.clientId,
        title: `Job Listing Approved`,
        body: `Your job listing "${job.title}" is now active.`
      }
    });
  }

  await logAdminAction(adminId, `JOB_MODERATION_${action}`, `Moderated job ${jobId} (${job.title}). Action: ${action}. Reason: ${reason || "none"}`);
  return job;
}

// 5. Dispute Resolution
export async function listDisputes() {
  return prisma.dispute.findMany();
}

export async function resolveDispute(adminId, disputeId, decision, refundPercent) {
  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: decision === "ESCALATE" ? "ESCALATED" : "RESOLVED",
      ruling: `Decision: ${decision}. Refund: ${refundPercent}%.`
    }
  });

  // Notify both parties (e.g. creator of dispute and client/freelancer involved on the job)
  const job = await prisma.job.findUnique({
    where: { id: dispute.jobId }
  });

  if (job) {
    const notifyUsers = [job.clientId, dispute.creatorId];
    for (const uid of notifyUsers) {
      await prisma.notification.create({
        data: {
          userId: uid,
          title: `Dispute Resolution Update`,
          body: `Dispute ${disputeId} regarding job "${job.title}" has been updated. Status: ${dispute.status}. Ruling: ${dispute.ruling}`
        }
      });
    }
  }

  await logAdminAction(adminId, `DISPUTE_RESOLUTION`, `Resolved dispute ${disputeId} with ruling: ${decision}, refund ${refundPercent}%`);
  return dispute;
}

// 6. Platform Controls
export async function getPlatformControls() {
  const reg = await prisma.platformSetting.findUnique({ where: { key: "registration_enabled" } });
  const jobs = await prisma.platformSetting.findUnique({ where: { key: "job_posting_enabled" } });

  return {
    registrationEnabled: reg ? reg.value === "true" : true,
    jobPostingEnabled: jobs ? jobs.value === "true" : true
  };
}

export async function updatePlatformControl(adminId, key, value) {
  const setting = await prisma.platformSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) }
  });

  await logAdminAction(adminId, `PLATFORM_CONTROL_UPDATE`, `Updated control ${key} to ${value}`);
  return setting;
}

// 7. Audit Log Viewer
export async function getAuditLogs(filters) {
  const { adminId, action, startDate, endDate } = filters;
  const where = {};

  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  return prisma.auditLog.findMany({
    where
  });
}
