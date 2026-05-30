import { prisma } from "../config/db.js";

export async function getAdminMetrics() {
  const usersCount = await prisma.user.count();
  const jobsCount = await prisma.job.count();
  const pendingDisputes = await prisma.dispute.count({
    where: { status: "PENDING" }
  });
  const paymentsSum = await prisma.payment.aggregate({
    _sum: { amount: true }
  });

  return {
    totalUsers: usersCount,
    totalJobs: jobsCount,
    pendingDisputes,
    monthlyVolume: paymentsSum._sum.amount || 0
  };
}

export async function getDisputes() {
  return prisma.dispute.findMany({
    include: {
      job: {
        select: {
          id: true,
          title: true
        }
      },
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      },
      resolver: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function resolveDispute(disputeId, { status, resolution, adminId }) {
  const updated = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status,
      resolution,
      resolverId: adminId
    }
  });

  // Log action to Audit Log
  await prisma.auditLog.create({
    data: {
      action: `RESOLVE_DISPUTE`,
      adminId,
      details: `Resolved dispute ${disputeId} with status ${status}. Resolution: ${resolution || "No description"}`
    }
  });

  return updated;
}

export async function verifyUser(userId, { isVerified, adminId }) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isVerified }
  });

  // Log action to Audit Log
  await prisma.auditLog.create({
    data: {
      action: isVerified ? `VERIFY_USER` : `SUSPEND_USER`,
      adminId,
      details: `${isVerified ? "Verified" : "Suspended"} user ${userId} (${updated.fullName} / ${updated.email})`
    }
  });

  return updated;
}

export async function getAuditLogs() {
  return prisma.auditLog.findMany({
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
