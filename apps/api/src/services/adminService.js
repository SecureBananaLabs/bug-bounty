export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900,
    totalUsers: 523,
    activeUsers: 317,
    pendingDisputes: 8,
    pendingReviews: 15,
    trustScoreDistribution: { "90-100": 87, "70-89": 156, "50-69": 134, "30-49": 89, "0-29": 57 }
  };
}

const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: `u${i + 1}`,
  email: `user${i + 1}@example.com`,
  fullName: ["Alice Wang", "Bob Chen", "Carol Li", "David Zhang", "Eva Liu", "Frank Yang", "Grace Wu", "Henry Xu", "Ivy Zhao", "Jack Huang"][i % 10],
  role: ["CLIENT", "FREELANCER", "ADMIN"][i % 3],
  status: ["active", "active", "active", "suspended", "active", "active", "banned", "active", "active", "active"][i % 10],
  isVerified: i % 4 !== 0,
  trustScore: 30 + Math.floor(Math.random() * 70),
  completedJobs: Math.floor(Math.random() * 25),
  disputesWon: Math.floor(Math.random() * 3),
  totalEarnings: Math.floor(Math.random() * 50000),
  joinedAt: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
  lastActive: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
}));

export async function getUsers({ page, limit, search, role, status } = {}) {
  let filtered = [...mockUsers];
  if (search) filtered = filtered.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  const total = filtered.length;
  const pg = page || 1;
  const lim = limit || 10;
  const start = (pg - 1) * lim;
  return { items: filtered.slice(start, start + lim), total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) };
}

export async function getUserDetail(userId) {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return null;
  return { ...user, jobs: Array.from({ length: 3 }, (_, i) => ({ id: `j${i}`, title: ["Build AI widget", "Fix API bug", "Design landing page"][i], budget: 500 + i * 300 })), disputes: Array.from({ length: 2 }, (_, i) => ({ id: `d${i}`, reason: ["Payment dispute", "Quality dispute"][i], status: ["OPEN", "RESOLVED"][i] })) };
}

export async function suspendUser(userId) { return { success: true, userId, action: "suspended" }; }
export async function reinstateUser(userId) { return { success: true, userId, action: "reinstate" }; }
export async function banUser(userId) { return { success: true, userId, action: "banned" }; }
export async function deleteUser(userId) { return { success: true, userId, action: "deleted" }; }

const mockFlagged = Array.from({ length: 25 }, (_, i) => ({
  id: `fj${i + 1}`,
  title: ["Suspicious job post", "Spam listing", "Fake proposal", "Duplicate job", "Inappropriate content"][i % 5],
  clientName: mockUsers[i % 50].fullName,
  clientId: mockUsers[i % 50].id,
  budget: 100 + Math.floor(Math.random() * 9000),
  flagReason: ["Automated detection", "User report", "System flag", "Spam filter", "Manual review"][i % 5],
  flagCount: 1 + Math.floor(Math.random() * 10),
  status: "flagged",
  createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
}));

export async function getFlaggedJobs({ page, limit } = {}) {
  const pg = page || 1;
  const lim = limit || 10;
  const total = mockFlagged.length;
  const start = (pg - 1) * lim;
  return { items: mockFlagged.slice(start, start + lim), total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) };
}

export async function approveJob(jobId) { return { success: true, jobId, action: "approved" }; }
export async function rejectJob(jobId, reason) { return { success: true, jobId, action: "rejected", reason }; }
export async function escalateJob(jobId) { return { success: true, jobId, action: "escalated" }; }

const mockDisputes = Array.from({ length: 20 }, (_, i) => ({
  id: `dsp${i + 1}`,
  jobId: `j${i}`,
  jobTitle: ["Full-stack project", "UI design", "API integration", "Mobile app", "Data pipeline"][i % 5],
  userId: mockUsers[i % 50].id,
  userName: mockUsers[i % 50].fullName,
  reason: ["Payment not released", "Scope creep", "Quality below expectation", "Milestone disagreement", "Communication breakdown"][i % 5],
  description: "Detailed description of the dispute...",
  status: ["OPEN", "UNDER_REVIEW", "RESOLVED"][i % 3],
  resolution: i % 3 === 2 ? "Ruled in favor of client" : null,
  reviewedBy: i % 3 === 2 ? "admin-001" : null,
  messages: [{ from: "client", body: "I need to escalate this issue", at: new Date().toISOString() }],
  createdAt: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

export async function getDisputes({ page, limit, status } = {}) {
  let filtered = [...mockDisputes];
  if (status) filtered = filtered.filter(d => d.status === status);
  const pg = page || 1;
  const lim = limit || 10;
  const total = filtered.length;
  const start = (pg - 1) * lim;
  return { items: filtered.slice(start, start + lim), total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) };
}

export async function getDisputeDetail(disputeId) {
  return mockDisputes.find(d => d.id === disputeId) || null;
}

export async function ruleDispute(disputeId, { ruling, ruledInFavor, adminNotes }) {
  return { success: true, disputeId, ruling, ruledInFavor, adminNotes };
}

export async function getPlatformControls() {
  return [
    { key: "registration_open", value: "true", description: "Allow new user registrations" },
    { key: "job_posting_open", value: "true", description: "Allow new job postings" },
  ];
}

const auditLog = Array.from({ length: 100 }, (_, i) => ({
  id: `aud${i + 1}`,
  action: ["suspend_user", "reinstate_user", "ban_user", "approve_job", "reject_job", "rule_dispute", "toggle_control", "delete_user"][i % 8],
  entityType: ["user", "job", "dispute", "control"][i % 4],
  entityId: `ent-${i}`,
  performedBy: mockUsers[i % 50].fullName,
  details: `Admin action ${i + 1}`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export async function getAuditLog({ page, limit, action, performedBy, startDate, endDate } = {}) {
  let filtered = [...auditLog];
  if (action) filtered = filtered.filter(l => l.action === action);
  if (performedBy) filtered = filtered.filter(l => l.performedBy.includes(performedBy));
  if (startDate) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(startDate));
  if (endDate) filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(endDate));
  const pg = page || 1;
  const lim = limit || 10;
  const total = filtered.length;
  const start = (pg - 1) * lim;
  return { items: filtered.slice(start, start + lim), total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) };
}

export async function updatePlatformControl(key, value) {
  const entry = { id: `aud-${Date.now()}`, action: "toggle_control", entityType: "control", entityId: key, performedBy: "admin", details: `${key}=${value}`, createdAt: new Date().toISOString() };
  auditLog.unshift(entry);
  return { success: true, key, value };
}
