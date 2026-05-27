import { listUsers, findUser, updateUser } from "./userService.js";
import { listJobs, findJob, updateJob } from "./jobService.js";
import { listProposals } from "./proposalService.js";
import { listReviews } from "./reviewService.js";

const auditLog = [];
const platformSettings = {
  allowRegistration: true,
  allowJobPosting: true,
  maintenanceMode: false,
};

export async function getAdminMetrics() {
  const users = await listUsers();
  const jobs = await listJobs();
  const proposals = await listProposals();
  const reviews = await listReviews();
  return {
    totalUsers: users.length,
    activeFreelancers: users.filter(u => u.role === "FREELANCER").length,
    flaggedAccounts: users.filter(u => u.flags?.suspended || u.flags?.banned).length,
    openJobs: jobs.filter(j => j.status === "open").length,
    totalJobs: jobs.length,
    totalProposals: proposals.length,
    totalReviews: reviews.length,
    monthlyVolume: 128900,
  };
}

export async function getUsers({ search, role, status, flagged, limit, offset }) {
  let all = await listUsers();
  if (search) {
    const q = search.toLowerCase();
    all = all.filter(u =>
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      u.id.includes(q)
    );
  }
  if (role) all = all.filter(u => u.role === role);
  if (flagged) all = all.filter(u => u.flags?.suspended || u.flags?.banned);
  if (status === "active") all = all.filter(u => !u.flags?.suspended && !u.flags?.banned);
  if (status === "suspended") all = all.filter(u => u.flags?.suspended);
  if (status === "banned") all = all.filter(u => u.flags?.banned);
  const total = all.length;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  return { users: all.slice(offsetNum, offsetNum + limitNum), total };
}

export async function getUserDetail(id) {
  const user = await findUser(id);
  if (!user) return null;
  const jobs = await listJobs();
  return {
    ...user,
    jobs: jobs.filter(j => j.clientId === id || j.freelancerId === id),
  };
}

export async function suspendUser(adminId, userId, reason) {
  const user = await updateUser(userId, { flags: { suspended: true, suspendReason: reason, suspendedBy: adminId, suspendedAt: new Date().toISOString() } });
  if (user) log("user.suspend", adminId, { userId, reason });
  return user;
}

export async function reinstateUser(adminId, userId) {
  const user = await updateUser(userId, { flags: { suspended: false, banned: false, suspendReason: null, suspendedBy: null, suspendedAt: null } });
  if (user) log("user.reinstate", adminId, { userId });
  return user;
}

export async function banUser(adminId, userId, reason) {
  const user = await updateUser(userId, { flags: { banned: true, banReason: reason, bannedBy: adminId, bannedAt: new Date().toISOString() } });
  if (user) log("user.ban", adminId, { userId, reason });
  return user;
}

export async function getFlaggedJobs({ status, limit, offset }) {
  let all = await listJobs();
  const limitNum = limit ? parseInt(limit, 10) : 20;
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  const flagged = all.filter(j => j.status === "flagged" || j.status === "open");
  const pending = status ? flagged.filter(j => j.status === status) : flagged;
  const total = pending.length;
  return { jobs: pending.slice(offsetNum, offsetNum + limitNum), total };
}

export async function moderateJob(adminId, jobId, action, reason) {
  const updates = {};
  if (action === "approve") updates.status = "open";
  else if (action === "reject") updates.status = "rejected";
  else if (action === "escalate") updates.status = "escalated";
  else if (action === "flag") updates.status = "flagged";
  else return null;
  updates.moderatedBy = adminId;
  updates.moderationReason = reason;
  updates.moderatedAt = new Date().toISOString();
  const job = await updateJob(jobId, updates);
  if (job) log(`job.${action}`, adminId, { jobId, reason });
  return job;
}

export async function getDisputes({ status, limit, offset }) {
  const all = await listJobs();
  const disputes = all.filter(j => j.status === "disputed" || j.status === "escalated");
  const filtered = status ? disputes.filter(j => j.status === status) : disputes;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  return { disputes: filtered.slice(offsetNum, offsetNum + limitNum), total: filtered.length };
}

export async function resolveDispute(adminId, jobId, ruling, refund) {
  const job = await updateJob(jobId, {
    status: "resolved",
    disputeRuling: ruling,
    disputeRefund: refund,
    resolvedBy: adminId,
    resolvedAt: new Date().toISOString(),
  });
  if (job) log("dispute.resolve", adminId, { jobId, ruling, refund });
  return job;
}

export function getPlatformSettings() {
  return { ...platformSettings };
}

export function updatePlatformSetting(adminId, key, value) {
  if (!(key in platformSettings)) return null;
  platformSettings[key] = value;
  log("settings.update", adminId, { key, value });
  return { ...platformSettings };
}

function log(action, adminId, details) {
  auditLog.push({
    id: auditLog.length + 1,
    action,
    adminId,
    details,
    ip: details?.ip || null,
    timestamp: new Date().toISOString(),
  });
}

export function getAuditLog({ action, adminId, from, to, limit, offset }) {
  let filtered = [...auditLog];
  if (action) filtered = filtered.filter(e => e.action === action);
  if (adminId) filtered = filtered.filter(e => e.adminId === adminId);
  if (from) filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(from));
  if (to) filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(to));
  const total = filtered.length;
  const limitNum = limit ? parseInt(limit, 10) : 50;
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  return { entries: filtered.slice(offsetNum, offsetNum + limitNum), total };
}
