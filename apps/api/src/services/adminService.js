// In-memory stores (replace with DB queries in production)
const users = [
  { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2025-01-15", trustScore: 92 },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinDate: "2025-02-20", trustScore: 88 },
  { id: "u3", name: "Carol White", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2025-03-10", trustScore: 45 },
  { id: "u4", name: "Dan Brown", email: "dan@example.com", role: "client", status: "active", joinDate: "2025-04-05", trustScore: 76 },
  { id: "u5", name: "Eve Davis", email: "eve@example.com", role: "freelancer", status: "banned", joinDate: "2025-05-01", trustScore: 12 },
];

const flaggedJobs = [
  { id: "j1", title: "Build AI chatbot", postedBy: "u2", reason: "Suspicious budget", status: "pending", flaggedAt: "2026-05-10" },
  { id: "j2", title: "SEO optimization", postedBy: "u4", reason: "Duplicate listing", status: "pending", flaggedAt: "2026-05-12" },
  { id: "j3", title: "Logo design", postedBy: "u2", reason: "User report", status: "escalated", flaggedAt: "2026-05-14" },
];

const disputes = [
  { id: "d1", title: "Payment not received", freelancer: "u1", client: "u2", status: "open", amount: 500, openedAt: "2026-05-08" },
  { id: "d2", title: "Work quality issue", freelancer: "u3", client: "u4", status: "under_review", amount: 1200, openedAt: "2026-05-11" },
  { id: "d3", title: "Scope creep dispute", freelancer: "u1", client: "u4", status: "resolved", amount: 800, openedAt: "2026-05-05" },
];

const auditLog = [];
const platformSettings = { registrationsEnabled: true, jobPostingsEnabled: true };

function logAction(adminId, action, target, detail) {
  auditLog.unshift({ id: `log-${Date.now()}`, adminId, action, target, detail, timestamp: new Date().toISOString() });
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes: disputes.filter(d => d.status === "open").length,
    flaggedListings: flaggedJobs.filter(j => j.status === "pending").length,
    revenue: 128900,
    trustDistribution: {
      high: users.filter(u => u.trustScore >= 80).length,
      medium: users.filter(u => u.trustScore >= 50 && u.trustScore < 80).length,
      low: users.filter(u => u.trustScore < 50).length,
    },
    platformSettings,
  };
}

export async function getUsers({ page = 1, limit = 10, role, status, search } = {}) {
  let filtered = [...users];
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updateUserStatus(userId, status, adminId) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  const prev = user.status;
  user.status = status;
  logAction(adminId, `user_${status}`, userId, `Changed status from ${prev} to ${status}`);
  return user;
}

export async function getFlaggedJobs({ page = 1, limit = 10 } = {}) {
  const total = flaggedJobs.length;
  const data = flaggedJobs.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function moderateJob(jobId, action, reason, adminId) {
  const job = flaggedJobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = action;
  logAction(adminId, `job_${action}`, jobId, reason || action);
  return job;
}

export async function getDisputes({ page = 1, limit = 10, status } = {}) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter(d => d.status === status);
  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function resolveDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.ruling = ruling;
  logAction(adminId, "dispute_resolved", disputeId, `Ruled in favour of: ${ruling}`);
  return dispute;
}

export async function getAuditLog({ page = 1, limit = 20, adminId: filterAdmin, action: filterAction } = {}) {
  let filtered = [...auditLog];
  if (filterAdmin) filtered = filtered.filter(l => l.adminId === filterAdmin);
  if (filterAction) filtered = filtered.filter(l => l.action === filterAction);
  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updatePlatformSettings(settings, adminId) {
  if (typeof settings.registrationsEnabled === "boolean") {
    platformSettings.registrationsEnabled = settings.registrationsEnabled;
    logAction(adminId, "toggle_registrations", "platform", `Set to ${settings.registrationsEnabled}`);
  }
  if (typeof settings.jobPostingsEnabled === "boolean") {
    platformSettings.jobPostingsEnabled = settings.jobPostingsEnabled;
    logAction(adminId, "toggle_job_postings", "platform", `Set to ${settings.jobPostingsEnabled}`);
  }
  return platformSettings;
}
