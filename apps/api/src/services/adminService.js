// ── In-memory stores (shared across requests for demo) ──

const users = [
  { id: "u1", username: "alice-dev", email: "alice@example.com", role: "freelancer", status: "active", joinedAt: "2026-01-15", trustScore: 92, activeJobs: 3 },
  { id: "u2", username: "bob-client", email: "bob@corp.com", role: "client", status: "active", joinedAt: "2026-02-20", trustScore: 85, activeJobs: 5 },
  { id: "u3", username: "carol-freelance", email: "carol@dev.io", role: "freelancer", status: "suspended", joinedAt: "2025-11-10", trustScore: 30, activeJobs: 0 },
  { id: "u4", username: "dave-admin", email: "dave@admin.com", role: "admin", status: "active", joinedAt: "2025-06-01", trustScore: 98, activeJobs: 0 },
  { id: "u5", username: "eve-spammer", email: "eve@spam.org", role: "freelancer", status: "banned", joinedAt: "2026-03-01", trustScore: 5, activeJobs: 0 },
];

const flaggedJobs = [
  { id: "fj1", jobId: "job-201", title: "Build a token launchpad", reporterId: "u2", reason: "Suspicious payment terms", flaggedAt: "2026-05-16T10:00:00Z", status: "pending" },
  { id: "fj2", jobId: "job-202", title: "SEO backlinks 10k", reporterId: "u1", reason: "Spam / low quality", flaggedAt: "2026-05-16T14:30:00Z", status: "pending" },
];

const disputes = [
  { id: "d1", jobId: "job-101", freelancerId: "u1", clientId: "u2", reason: "Client refuses to release milestone", status: "open", evidence: ["screenshot1.png"], createdAt: "2026-05-14", messages: [{ from: "u1", text: "I completed the work as agreed", at: "2026-05-14T10:00:00Z" }, { from: "u2", text: "The deliverable doesn't meet spec", at: "2026-05-14T12:00:00Z" }] },
  { id: "d2", jobId: "job-102", freelancerId: "u3", clientId: "u2", reason: "Freelancer disappeared", status: "under_review", evidence: [], createdAt: "2026-05-15", messages: [{ from: "u2", text: "No response for 5 days", at: "2026-05-15T08:00:00Z" }] },
];

const auditLog = [];

function logAudit(adminId, action, target, details = {}) {
  const entry = {
    id: `audit-${auditLog.length + 1}`,
    adminId,
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

let registrationsOpen = true;
let postingsOpen = true;

// ── Metrics ──

export function getAdminMetrics() {
  const activeUsers = users.filter(u => u.status === "active").length;
  const suspendedUsers = users.filter(u => u.status === "suspended" || u.status === "banned").length;
  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes: disputes.filter(d => d.status === "open" || d.status === "under_review").length,
    flaggedListings: flaggedJobs.filter(f => f.status === "pending").length,
    revenue: 128900,
    registrationsOpen,
    postingsOpen,
  };
}

export function getTrustDistribution() {
  const brackets = { "90-100": 0, "70-89": 0, "50-69": 0, "30-49": 0, "0-29": 0 };
  for (const u of users) {
    if (u.trustScore >= 90) brackets["90-100"]++;
    else if (u.trustScore >= 70) brackets["70-89"]++;
    else if (u.trustScore >= 50) brackets["50-69"]++;
    else if (u.trustScore >= 30) brackets["30-49"]++;
    else brackets["0-29"]++;
  }
  return brackets;
}

// ── User Management ──

export function getUsers({ search, role, status, page = 1, limit = 10 }) {
  let filtered = [...users];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function updateUserStatus(adminId, userId, newStatus) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const oldStatus = user.status;
  user.status = newStatus;
  logAudit(adminId, `user_${newStatus}`, userId, { from: oldStatus, to: newStatus });
  return user;
}

export function getUserById(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const userDisputes = disputes.filter(d => d.freelancerId === userId || d.clientId === userId);
  return { ...user, disputeHistory: userDisputes };
}

// ── Job Moderation ──

export function getFlaggedJobs({ page = 1, limit = 10 }) {
  const total = flaggedJobs.length;
  const start = (page - 1) * limit;
  return { items: flaggedJobs.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function moderateFlaggedJob(adminId, flagId, action, reason = "") {
  const flag = flaggedJobs.find(f => f.id === flagId);
  if (!flag) return null;
  flag.status = action; // approved | rejected | escalated
  logAudit(adminId, `flag_${action}`, flag.jobId, { flagId, reason });
  return flag;
}

// ── Disputes ──

export function getDisputes({ status, page = 1, limit = 10 }) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter(d => d.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function ruleDispute(adminId, disputeId, ruling) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) return null;
  dispute.status = "resolved";
  dispute.ruling = ruling; // { inFavorOf: "freelancer" | "client", action: "refund" | "release" | "escalate", note: "" }
  logAudit(adminId, "dispute_resolved", disputeId, ruling);
  return dispute;
}

// ── Platform Controls ──

export function toggleRegistrations(adminId, enabled) {
  registrationsOpen = enabled;
  logAudit(adminId, "toggle_registrations", "platform", { enabled });
  return { registrationsOpen };
}

export function togglePostings(adminId, enabled) {
  postingsOpen = enabled;
  logAudit(adminId, "toggle_postings", "platform", { enabled });
  return { postingsOpen };
}

// ── Audit Log ──

export function getAuditLog({ adminId, action, from, to, page = 1, limit = 20 }) {
  let filtered = [...auditLog].reverse();
  if (adminId) filtered = filtered.filter(e => e.adminId === adminId);
  if (action) filtered = filtered.filter(e => e.action.includes(action));
  if (from) filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(from));
  if (to) filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(to));
  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}
