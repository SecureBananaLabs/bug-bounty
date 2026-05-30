import { prisma } from "../config/db.js";

export async function getAdminMetrics() {
  const [users, jobs, openJobs, disputes, openDisputes] = await Promise.all([
    prisma.user.count(), prisma.job.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
  ]);
  return { totalUsers: users, totalJobs: jobs, openJobs, totalDisputes: disputes, openDisputes };
}

export async function listUsers({ page = "1", limit = "20", role, search }) {
  const where = {};
  if (role) where.role = role;
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

export async function getUserDetail(userId) {
  return prisma.user.findUnique({ where: { id: Number(userId) }, include: { jobs: true, proposals: true } });
}

export async function updateUserStatus(userId, status) {
  return prisma.user.update({ where: { id: Number(userId) }, data: { status } });
}

export async function listFlaggedJobs({ page = "1", limit = "20" }) {
  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where: { isFlagged: true }, skip, take: Number(limit),
      include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.job.count({ where: { isFlagged: true } }),
  ]);
  return { jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

export async function moderateJob(jobId, action) {
  const update = action === "reject" ? { isFlagged: false, status: "REJECTED" }
    : action === "approve" ? { isFlagged: false } : {};
  return prisma.job.update({ where: { id: Number(jobId) }, data: update });
}

export async function listDisputes({ page = "1", limit = "20", status }) {
  const where = {};
  if (status) where.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

export async function getDisputeDetail(disputeId) {
  return prisma.dispute.findUnique({ where: { id: Number(disputeId) }, include: { job: true } });
}

export async function resolveDispute(disputeId, ruling) {
  return prisma.dispute.update({ where: { id: Number(disputeId) },
    data: { status: "RESOLVED", resolution: ruling, resolvedAt: new Date() } });
}

let controls = { registrationOpen: true, jobPostingOpen: true };
export async function getPlatformControls() { return controls; }
export async function updatePlatformControls(data) { controls = { ...controls, ...data }; return controls; }
