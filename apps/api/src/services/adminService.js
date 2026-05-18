// Admin Service — all queries are paginated server-side.
// Audit log is append-only.

const auditLog = []; // In production: persist to DB

function appendAudit(adminId, action, target, details = {}) {
  auditLog.push({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    adminId, action, target, details,
    timestamp: new Date().toISOString(),
  });
}

export async function getAdminMetrics() {
  return {
    totalUsers: 312,
    activeJobs: 42,
    openDisputes: 7,
    flaggedListings: 3,
    revenue: { current: 128900, currency: "usd" },
    trustScoreDistribution: {
      "0-20": 12, "21-40": 28, "41-60": 67, "61-80": 119, "81-100": 86,
    },
    refreshedAt: new Date().toISOString(),
  };
}

export async function listUsers({ page, limit, role, status, search }) {
  // Stub — replace with real DB query
  const users = Array.from({ length: 50 }, (_, i) => ({
    id: `user_${i}`, name: `User ${i}`, email: `user${i}@example.com`,
    role: i % 3 === 0 ? "client" : "freelancer",
    status: i === 5 ? "suspended" : "active",
    joinedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  let filtered = users;
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) filtered = filtered.filter(u =>
    u.name.includes(search) || u.email.includes(search));

  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length, page, limit,
    pages: Math.ceil(filtered.length / limit),
  };
}

export async function updateUserStatus(userId, action, adminId) {
  const statusMap = { suspend: "suspended", reinstate: "active", ban: "banned" };
  appendAudit(adminId, `user.${action}`, userId, { action });
  return { userId, status: statusMap[action], updatedAt: new Date().toISOString() };
}

export async function listFlaggedJobs({ page, limit }) {
  const jobs = Array.from({ length: 10 }, (_, i) => ({
    id: `job_${i}`, title: `Flagged Job ${i}`,
    reason: i % 2 === 0 ? "automated_rule" : "user_report",
    status: "pending_review", flaggedAt: new Date().toISOString(),
  }));
  const start = (page - 1) * limit;
  return { data: jobs.slice(start, start + limit), total: jobs.length, page, limit };
}

export async function moderateJob(jobId, action, reason, adminId) {
  appendAudit(adminId, `job.${action}`, jobId, { reason });
  return { jobId, action, reason, moderatedAt: new Date().toISOString() };
}

export async function listDisputes({ page, limit, status }) {
  const disputes = Array.from({ length: 15 }, (_, i) => ({
    id: `dispute_${i}`,
    status: ["open", "under_review", "resolved"][i % 3],
    freelancerId: `user_${i}`, clientId: `user_${i + 1}`,
    amount: (i + 1) * 50, createdAt: new Date().toISOString(),
  }));
  let filtered = status ? disputes.filter(d => d.status === status) : disputes;
  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit };
}

export async function resolveDispute(disputeId, ruling, notes, adminId) {
  appendAudit(adminId, "dispute.resolve", disputeId, { ruling, notes });
  return { disputeId, ruling, notes, resolvedAt: new Date().toISOString() };
}

export async function listAuditLog({ page, limit, adminId, action, from, to }) {
  let filtered = [...auditLog];
  if (adminId) filtered = filtered.filter(e => e.adminId === adminId);
  if (action) filtered = filtered.filter(e => e.action.includes(action));
  if (from) filtered = filtered.filter(e => e.timestamp >= from);
  if (to) filtered = filtered.filter(e => e.timestamp <= to);
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit };
}

const platformControls = {
  registrations_enabled: true,
  job_postings_enabled: true,
};

export async function getPlatformControls() {
  return { controls: platformControls };
}

export async function setPlatformControl(key, enabled, adminId) {
  if (!(key in platformControls)) throw new Error(`Unknown control key: ${key}`);
  platformControls[key] = enabled;
  appendAudit(adminId, "control.toggle", key, { enabled });
  return { key, enabled, updatedAt: new Date().toISOString() };
}
