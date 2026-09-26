const now = new Date().toISOString();

const adminUsers = [
  {
    id: "usr_client_1",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02",
    trustScore: 87,
    activeJobs: 3,
    disputeHistory: 1
  },
  {
    id: "usr_freelancer_1",
    name: "Rafael Ortiz",
    email: "rafael@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-18",
    trustScore: 94,
    activeJobs: 5,
    disputeHistory: 0
  },
  {
    id: "usr_freelancer_2",
    name: "Iris Taylor",
    email: "iris@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-02-11",
    trustScore: 42,
    activeJobs: 1,
    disputeHistory: 3
  }
];

const flaggedJobs = [
  {
    id: "job_flagged_1",
    title: "Urgent escrow migration",
    clientId: "usr_client_1",
    status: "flagged",
    reason: "High-risk payment language",
    reportedAt: now
  },
  {
    id: "job_flagged_2",
    title: "Landing page clone",
    clientId: "usr_client_1",
    status: "under_review",
    reason: "Potential IP infringement",
    reportedAt: now
  }
];

const disputes = [
  {
    id: "disp_1",
    jobId: "job_flagged_1",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_2",
    status: "open",
    amount: 1200,
    thread: ["Client reports missed milestone.", "Freelancer uploaded partial evidence."],
    evidence: ["milestone-chat.pdf", "delivery.zip"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "audit_seed_1",
    adminId: "system",
    action: "admin_panel_seeded",
    targetType: "platform",
    targetId: "freelanceflow",
    createdAt: now
  }
];

function appendAudit(adminId, action, targetType, targetId, details = {}) {
  const entry = {
    id: `audit_${Date.now()}_${auditLog.length}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    items: items.slice(start, start + safePageSize)
  };
}

export async function getAdminMetrics() {
  return {
    totalUsers: adminUsers.length,
    activeJobs: 9,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: {
      high: adminUsers.filter((user) => user.trustScore >= 80).length,
      medium: adminUsers.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
      low: adminUsers.filter((user) => user.trustScore < 50).length
    }
  };
}

export async function listAdminUsers(filters = {}) {
  let users = [...adminUsers];
  if (filters.role) users = users.filter((user) => user.role === filters.role);
  if (filters.status) users = users.filter((user) => user.status === filters.status);
  if (filters.search) {
    const query = filters.search.toLowerCase();
    users = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query));
  }
  if (filters.joinedAfter) users = users.filter((user) => user.joinedAt >= filters.joinedAfter);
  return paginate(users, filters);
}

export async function updateUserStatus(userId, status, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Unsupported user status");
  }
  const user = adminUsers.find((item) => item.id === userId);
  if (!user) throw new Error("User not found");
  user.status = status;
  appendAudit(adminId, `user_${status}`, "user", userId);
  return user;
}

export async function listFlaggedJobs(filters = {}) {
  const jobs = filters.status ? flaggedJobs.filter((job) => job.status === filters.status) : flaggedJobs;
  return paginate(jobs, filters);
}

export async function moderateJob(jobId, decision, reason, adminId) {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw new Error("Unsupported moderation decision");
  }
  const job = flaggedJobs.find((item) => item.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = decision;
  job.decisionReason = reason;
  appendAudit(adminId, `job_${decision}`, "job", jobId, { reason });
  return job;
}

export async function listDisputes(filters = {}) {
  const items = filters.status ? disputes.filter((dispute) => dispute.status === filters.status) : disputes;
  return paginate(items, filters);
}

export async function ruleOnDispute(disputeId, ruling, adminId) {
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw new Error("Unsupported dispute ruling");
  }
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  appendAudit(adminId, `dispute_${ruling}`, "dispute", disputeId);
  return dispute;
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(key, enabled, adminId) {
  if (!Object.hasOwn(platformControls, key)) throw new Error("Unknown platform control");
  platformControls[key] = Boolean(enabled);
  appendAudit(adminId, "platform_control_updated", "control", key, { enabled: platformControls[key] });
  return { key, enabled: platformControls[key] };
}

export async function listAuditLog(filters = {}) {
  let entries = [...auditLog];
  if (filters.adminId) entries = entries.filter((entry) => entry.adminId === filters.adminId);
  if (filters.action) entries = entries.filter((entry) => entry.action === filters.action);
  if (filters.from) entries = entries.filter((entry) => entry.createdAt >= filters.from);
  if (filters.to) entries = entries.filter((entry) => entry.createdAt <= filters.to);
  return paginate(entries, filters);
}
