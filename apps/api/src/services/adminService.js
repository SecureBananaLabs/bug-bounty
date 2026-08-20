// Admin service — all admin operations: users, jobs, disputes, metrics, controls, audit log

// In-memory stores (mock — replace with DB queries in production)
const users = [
  { id: 1, name: "Alice Chen", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2026-01-15", trustScore: 92, activeJobs: 3 },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinDate: "2026-02-20", trustScore: 78, activeJobs: 1 },
  { id: 3, name: "Carol Davis", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2026-03-10", trustScore: 45, activeJobs: 0 },
  { id: 4, name: "Dan Wilson", email: "dan@example.com", role: "admin", status: "active", joinDate: "2025-11-01", trustScore: 100, activeJobs: 0 },
  { id: 5, name: "Eve Johnson", email: "eve@example.com", role: "freelancer", status: "active", joinDate: "2026-04-05", trustScore: 88, activeJobs: 2 },
];

const flaggedJobs = [
  { id: 201, title: "SEO spam article", postedBy: "bob@example.com", flagReason: "Spam content", status: "pending", flaggedAt: "2026-05-15" },
  { id: 202, title: "Fake review service", postedBy: "unknown@example.com", flagReason: "Scam", status: "pending", flaggedAt: "2026-05-17" },
];

const disputes = [
  { id: 301, jobId: 101, freelancerId: 1, clientId: 2, status: "open", reason: "Deliverable mismatch", amount: 500, openedAt: "2026-05-10" },
  { id: 302, jobId: 102, freelancerId: 5, clientId: 2, status: "under_review", reason: "Late delivery", amount: 800, openedAt: "2026-05-08" },
  { id: 303, jobId: 103, freelancerId: 1, clientId: 3, status: "resolved", reason: "Scope change", amount: 300, openedAt: "2026-04-20", resolvedAt: "2026-04-22" },
];

let platformConfig = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};

const auditLog = [];

function addAuditEntry(adminId, action, details) {
  auditLog.push({
    id: auditLog.length + 1,
    adminId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

// --- User Management ---

export async function getUsers({ page = 1, limit = 10, role, status, search } = {}) {
  let filtered = [...users];
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateUserStatus(userId, status, adminId) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  user.status = status;
  addAuditEntry(adminId, `user_${status}`, `User ${userId} (${user.email}) set to ${status}`);
  return user;
}

export async function getUserById(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  const userDisputes = disputes.filter(d => d.freelancerId === userId || d.clientId === userId);
  return { ...user, disputes: userDisputes };
}

// --- Job Moderation ---

export async function getFlaggedJobs({ page = 1, limit = 10 } = {}) {
  const total = flaggedJobs.length;
  const start = (page - 1) * limit;
  const items = flaggedJobs.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function moderateJob(jobId, action, reason, adminId) {
  const job = flaggedJobs.find(j => j.id === jobId);
  if (!job) throw new Error("Flagged job not found");
  job.status = action; // "approved", "rejected", "escalated"
  addAuditEntry(adminId, `job_${action}`, `Job ${jobId} "${job.title}" ${action} — ${reason}`);
  return job;
}

// --- Dispute Resolution ---

export async function getDisputes({ page = 1, limit = 10, status } = {}) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter(d => d.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function resolveDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.resolvedAt = new Date().toISOString();
  dispute.ruling = ruling;
  addAuditEntry(adminId, "dispute_resolved", `Dispute ${disputeId} resolved in favor of ${ruling}`);
  return dispute;
}

// --- Metrics ---

export async function getAdminMetrics() {
  const activeUsers = users.filter(u => u.status === "active").length;
  const openDisputes = disputes.filter(d => d.status === "open" || d.status === "under_review").length;
  const flaggedCount = flaggedJobs.filter(j => j.status === "pending").length;

  const trustScores = users.map(u => u.trustScore).sort((a, b) => a - b);
  const distribution = {};
  const brackets = [[0, 25], [26, 50], [51, 75], [76, 100]];
  for (const [min, max] of brackets) {
    const count = trustScores.filter(s => s >= min && s <= max).length;
    distribution[`${min}-${max}`] = count;
  }

  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes,
    flaggedListings: flaggedCount,
    revenue: 128900,
    trustDistribution: distribution,
    platformConfig: { ...platformConfig },
  };
}

// --- Platform Controls ---

export async function toggleRegistrations(enabled, adminId) {
  platformConfig.registrationsEnabled = enabled;
  addAuditEntry(adminId, "toggle_registrations", `Registrations ${enabled ? "enabled" : "disabled"}`);
  return { ...platformConfig };
}

export async function toggleJobPostings(enabled, adminId) {
  platformConfig.jobPostingsEnabled = enabled;
  addAuditEntry(adminId, "toggle_job_postings", `Job postings ${enabled ? "enabled" : "disabled"}`);
  return { ...platformConfig };
}

// --- Audit Log ---

export async function getAuditLog({ page = 1, limit = 20, adminId, action, dateFrom, dateTo } = {}) {
  let filtered = [...auditLog].reverse();
  if (adminId) filtered = filtered.filter(e => e.adminId === adminId);
  if (action) filtered = filtered.filter(e => e.action === action);
  if (dateFrom) filtered = filtered.filter(e => e.timestamp >= dateFrom);
  if (dateTo) filtered = filtered.filter(e => e.timestamp <= dateTo);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}
