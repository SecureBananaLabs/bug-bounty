/**
 * Admin Service — full admin panel backend.
 *
 * All methods return mock data that matches the expected schema.
 * In production these would query the database (Prisma/SQL).
 * The structure is real — just the data source is mocked.
 */

// ── In-memory stores (would be DB tables in production) ──────────────

const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "freelancer", status: "active", joinedAt: "2026-01-15T10:00:00Z" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinedAt: "2026-02-20T14:30:00Z" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "freelancer", status: "suspended", joinedAt: "2026-03-01T09:00:00Z" },
  { id: 4, name: "Diana Lee", email: "diana@example.com", role: "client", status: "active", joinedAt: "2026-03-10T16:45:00Z" },
  { id: 5, name: "Eve Martinez", email: "eve@example.com", role: "freelancer", status: "banned", joinedAt: "2026-04-05T11:20:00Z" },
];

const jobs = [
  { id: 1, title: "Build landing page", status: "flagged", postedBy: 2, flaggedReason: "Suspicious pricing", createdAt: "2026-05-01T08:00:00Z" },
  { id: 2, title: "API integration", status: "flagged", postedBy: 4, flaggedReason: "Duplicate listing", createdAt: "2026-05-10T12:00:00Z" },
  { id: 3, title: "Mobile app UI", status: "open", postedBy: 2, createdAt: "2026-05-15T10:00:00Z" },
];

const disputes = [
  { id: 1, jobId: 1, freelancerId: 1, clientId: 2, status: "open", reason: "Work not delivered", createdAt: "2026-05-20T09:00:00Z", thread: [{ from: 2, message: "The freelancer never delivered the work.", at: "2026-05-20T09:00:00Z" }, { from: 1, message: "I was waiting for clarification on requirements.", at: "2026-05-20T10:30:00Z" }] },
  { id: 2, jobId: 3, freelancerId: 3, clientId: 4, status: "under_review", reason: "Quality dispute", createdAt: "2026-05-22T14:00:00Z", thread: [{ from: 4, message: "The code quality is below expectations.", at: "2026-05-22T14:00:00Z" }] },
];

const auditLog = [];
let platformSettings = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};

// ── Helper ────────────────────────────────────────────────────────────

function paginate(arr, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  return {
    items: arr.slice(start, start + limit),
    total: arr.length,
    page,
    limit,
    totalPages: Math.ceil(arr.length / limit),
  };
}

function addAuditEntry(adminId, action, detail) {
  auditLog.push({
    id: auditLog.length + 1,
    adminId,
    action,
    detail,
    timestamp: new Date().toISOString(),
  });
}

// ── Metrics ───────────────────────────────────────────────────────────

export async function getAdminMetrics() {
  const activeUsers = users.filter((u) => u.status === "active").length;
  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const flaggedListings = jobs.filter((j) => j.status === "flagged").length;
  const revenue = 128900; // current period

  const trustDistribution = {
    high: users.filter((u) => u.status === "active").length,
    medium: users.filter((u) => u.status === "suspended").length,
    low: users.filter((u) => u.status === "banned").length,
  };

  return {
    totalUsers: users.length,
    activeUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenue,
    trustDistribution,
  };
}

// ── User Management ───────────────────────────────────────────────────

export async function listUsers({ page = 1, limit = 20, role, status, search } = {}) {
  let filtered = [...users];
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  return paginate(filtered, page, limit);
}

export async function getUser(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  const userJobs = jobs.filter((j) => j.postedBy === userId);
  const userDisputes = disputes.filter(
    (d) => d.freelancerId === userId || d.clientId === userId
  );
  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function updateUserStatus(userId, status, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  const oldStatus = user.status;
  user.status = status;
  addAuditEntry(adminId, "user_status_change", {
    userId,
    from: oldStatus,
    to: status,
  });
  return user;
}

// ── Job Moderation ────────────────────────────────────────────────────

export async function listFlaggedJobs({ page = 1, limit = 20 } = {}) {
  const flagged = jobs.filter((j) => j.status === "flagged");
  return paginate(flagged, page, limit);
}

export async function moderateJob(jobId, action, reason, adminId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");
  const oldStatus = job.status;
  job.status = action; // "approved" | "rejected" | "escalated"
  addAuditEntry(adminId, "job_moderation", {
    jobId,
    action,
    reason,
    from: oldStatus,
  });
  return job;
}

// ── Dispute Resolution ────────────────────────────────────────────────

export async function listDisputes({ page = 1, limit = 20, status } = {}) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter((d) => d.status === status);
  return paginate(filtered, page, limit);
}

export async function getDispute(disputeId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  const job = jobs.find((j) => j.id === dispute.jobId);
  return { ...dispute, job };
}

export async function resolveDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.ruling = ruling;
  addAuditEntry(adminId, "dispute_resolution", {
    disputeId,
    ruling,
  });
  return dispute;
}

// ── Platform Controls ─────────────────────────────────────────────────

export async function getPlatformSettings() {
  return { ...platformSettings };
}

export async function togglePlatformSetting(key, value, adminId) {
  if (!(key in platformSettings)) throw new Error("Invalid setting");
  const old = platformSettings[key];
  platformSettings[key] = value;
  addAuditEntry(adminId, "platform_setting", { key, from: old, to: value });
  return platformSettings;
}

// ── Audit Log ─────────────────────────────────────────────────────────

export async function getAuditLog({ page = 1, limit = 20, adminId, action, from, to } = {}) {
  let filtered = [...auditLog];
  if (adminId) filtered = filtered.filter((e) => e.adminId === adminId);
  if (action) filtered = filtered.filter((e) => e.action === action);
  if (from) filtered = filtered.filter((e) => e.timestamp >= from);
  if (to) filtered = filtered.filter((e) => e.timestamp <= to);
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return paginate(filtered, page, limit);
}
