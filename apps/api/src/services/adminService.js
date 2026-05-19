const auditLog = [];
let platformSettings = { registrationOpen: true, jobPostingOpen: true };

const users = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2025-01-15", trustScore: 92 },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "client", status: "active", joinDate: "2025-02-20", trustScore: 85 },
  { id: "u3", name: "Carol Davis", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2025-03-10", trustScore: 45 },
  { id: "u4", name: "Dan Wilson", email: "dan@example.com", role: "admin", status: "active", joinDate: "2025-01-01", trustScore: 100 },
];

const jobs = [
  { id: "j1", title: "Build React dashboard", poster: "Bob Smith", status: "flagged", flagReason: "Suspicious payment terms", budget: 500 },
  { id: "j2", title: "Logo design needed", poster: "Eve Jones", status: "flagged", flagReason: "Duplicate listing", budget: 200 },
];

const disputes = [
  { id: "d1", title: "Payment not received", freelancer: "Alice Chen", client: "Bob Smith", status: "open", amount: 500,
    thread: [{ from: "Alice", msg: "Work completed but no payment" }, { from: "Bob", msg: "Deliverables incomplete" }] },
  { id: "d2", title: "Missed deadline", freelancer: "Carol Davis", client: "Eve Jones", status: "under_review", amount: 300,
    thread: [{ from: "Eve", msg: "Project 2 weeks late" }] },
];

function addAudit(adminId, action, target, details = {}) {
  auditLog.push({ id: `audit_${Date.now()}`, adminId, action, target, details, timestamp: new Date().toISOString() });
}

export function getAuditLog({ adminId, action, from, to, page = 1, limit = 20 } = {}) {
  let results = [...auditLog].reverse();
  if (adminId) results = results.filter(e => e.adminId === adminId);
  if (action) results = results.filter(e => e.action === action);
  if (from) results = results.filter(e => new Date(e.timestamp) >= new Date(from));
  if (to) results = results.filter(e => new Date(e.timestamp) <= new Date(to));
  const total = results.length, start = (page - 1) * limit;
  return { items: results.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function getUsers({ search, role, status, page = 1, limit = 10 } = {}) {
  let results = [...users];
  if (search) { const q = search.toLowerCase(); results = results.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
  if (role) results = results.filter(u => u.role === role);
  if (status) results = results.filter(u => u.status === status);
  const total = results.length, start = (page - 1) * limit;
  return { items: results.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function getUserById(userId) { return users.find(u => u.id === userId) || null; }

export function updateUserStatus(userId, status, adminId) {
  const user = users.find(u => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  user.status = status;
  addAudit(adminId, `user_${status}`, userId);
  return user;
}

export function getFlaggedJobs({ page = 1, limit = 10 } = {}) {
  const total = jobs.length, start = (page - 1) * limit;
  return { items: jobs.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function moderateJob(jobId, action, adminId, reason = "") {
  const job = jobs.find(j => j.id === jobId);
  if (!job) throw Object.assign(new Error("Job not found"), { status: 404 });
  job.status = action === "approve" ? "active" : "rejected";
  addAudit(adminId, `job_${action}`, jobId, { reason });
  return job;
}

export function getDisputes({ status, page = 1, limit = 10 } = {}) {
  let results = [...disputes];
  if (status) results = results.filter(d => d.status === status);
  const total = results.length, start = (page - 1) * limit;
  return { items: results.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function resolveDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { status: 404 });
  dispute.status = "resolved";
  dispute.ruling = ruling;
  addAudit(adminId, "dispute_resolved", disputeId, { ruling });
  return dispute;
}

export function getMetrics() {
  return {
    totalUsers: users.length, activeJobs: 12,
    openDisputes: disputes.filter(d => d.status !== "resolved").length,
    flaggedListings: jobs.length, revenue: 12500,
    trustScoreDistribution: { "90-100": 25, "70-89": 40, "50-69": 20, "below-50": 15 },
  };
}

export function getPlatformSettings() { return { ...platformSettings }; }
export function updatePlatformSetting(key, value, adminId) {
  platformSettings[key] = value;
  addAudit(adminId, `toggle_${key}`, "platform", { key, value });
  return platformSettings;
}
