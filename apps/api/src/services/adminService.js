let auditLogs = [];
let platformControls = {
  registrations: true,
  jobPostings: true
};

export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900,
    trustScoreAverage: 8.4
  };
}

export async function listUsers({ page, limit, search, role, status }) {
  // Mock user data
  const users = Array.from({ length: 50 }, (_, i) => ({
    id: `usr_${i}`,
    email: `user${i}@example.com`,
    role: i % 2 === 0 ? "freelancer" : "client",
    status: i % 10 === 0 ? "suspended" : "active",
    joinedAt: new Date(Date.now() - i * 86400000).toISOString()
  }));

  let filtered = users;
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) filtered = filtered.filter(u => u.email.includes(search));

  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit)
  };
}

export async function setUserStatus(id, status, reason, adminId) {
  auditLogs.push({
    timestamp: new Date().toISOString(),
    adminId,
    action: `USER_${status.toUpperCase()}`,
    targetId: id,
    metadata: { reason }
  });
  return { id, status, updated: true };
}

export async function getFlaggedContent() {
  return [
    { id: "job_1", type: "job", title: "Suspicious Crypto Job", flaggedBy: "system", reason: "Spam keywords" },
    { id: "job_2", type: "job", title: "Direct Payment Request", flaggedBy: "user_123", reason: "Terms violation" }
  ];
}

export async function processModeration(id, action, reason, adminId) {
  auditLogs.push({
    timestamp: new Date().toISOString(),
    adminId,
    action: `MODERATION_${action.toUpperCase()}`,
    targetId: id,
    metadata: { reason }
  });
  return { id, action, status: "processed" };
}

export async function listDisputes() {
  return [
    { id: "disp_1", client: "client_1", freelancer: "free_1", amount: 500, status: "open", reason: "Non-delivery" },
    { id: "disp_2", client: "client_2", freelancer: "free_2", amount: 1200, status: "under_review", reason: "Quality issue" }
  ];
}

export async function closeDispute(id, { winner, resolution, refundAmount }, adminId) {
  auditLogs.push({
    timestamp: new Date().toISOString(),
    adminId,
    action: "DISPUTE_RESOLVED",
    targetId: id,
    metadata: { winner, resolution, refundAmount }
  });
  return { id, status: "resolved", winner };
}

export async function fetchAuditLogs() {
  return auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function setPlatformControl(type, enabled, adminId) {
  platformControls[type] = enabled;
  auditLogs.push({
    timestamp: new Date().toISOString(),
    adminId,
    action: "PLATFORM_CONTROL_UPDATE",
    metadata: { type, enabled }
  });
  return { type, enabled };
}
