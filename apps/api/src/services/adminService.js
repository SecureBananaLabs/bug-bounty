const users = [
  { id: "usr_client_1", name: "Maya Stone", email: "maya@example.com", role: "client", status: "active", joinedAt: "2026-01-10", trustScore: 92, activeJobs: 3, disputes: 0 },
  { id: "usr_freelancer_1", name: "Noah Chen", email: "noah@example.com", role: "freelancer", status: "active", joinedAt: "2026-02-14", trustScore: 81, activeJobs: 2, disputes: 1 },
  { id: "usr_client_2", name: "Priya Rao", email: "priya@example.com", role: "client", status: "suspended", joinedAt: "2026-03-02", trustScore: 47, activeJobs: 0, disputes: 2 },
  { id: "usr_freelancer_2", name: "Eli Brooks", email: "eli@example.com", role: "freelancer", status: "active", joinedAt: "2026-03-21", trustScore: 68, activeJobs: 1, disputes: 0 },
  { id: "usr_client_3", name: "Sofia Martin", email: "sofia@example.com", role: "client", status: "banned", joinedAt: "2026-04-03", trustScore: 22, activeJobs: 0, disputes: 4 }
];

const flaggedJobs = [
  { id: "job_101", title: "Marketplace scraping bot", posterId: "usr_client_2", reason: "Potential ToS violation", status: "flagged", reportedAt: "2026-05-18" },
  { id: "job_102", title: "Landing page polish", posterId: "usr_client_1", reason: "Payment terms missing", status: "flagged", reportedAt: "2026-05-19" },
  { id: "job_103", title: "KYC workflow review", posterId: "usr_client_3", reason: "User report: suspicious scope", status: "escalated", reportedAt: "2026-05-20" }
];

const disputes = [
  {
    id: "dsp_201",
    jobTitle: "API integration",
    freelancerId: "usr_freelancer_1",
    clientId: "usr_client_1",
    status: "open",
    amount: 850,
    evidence: ["Milestone brief", "Delivery screenshots"],
    thread: ["Client reports incomplete webhooks.", "Freelancer provided logs for retries."]
  },
  {
    id: "dsp_202",
    jobTitle: "Brand refresh",
    freelancerId: "usr_freelancer_2",
    clientId: "usr_client_2",
    status: "under_review",
    amount: 420,
    evidence: ["Design files", "Revision request"],
    thread: ["Freelancer claims scope creep.", "Client asks for refund."]
  }
];

const controls = {
  registrations: { key: "registrations", enabled: true, label: "New user registrations" },
  jobPostings: { key: "jobPostings", enabled: true, label: "New job postings" }
};

const auditLog = [
  { id: "aud_1", adminId: "system", action: "seeded_admin_panel", target: "platform", createdAt: "2026-05-17T05:53:00.000Z", note: "Initial admin data loaded" }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: {
      high: users.filter((user) => user.trustScore >= 80).length,
      medium: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
      low: users.filter((user) => user.trustScore < 50).length
    }
  };
}

export async function listUsers(query = {}) {
  const filtered = users.filter((user) => {
    const search = query.search?.toLowerCase();
    return (!search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search))
      && (!query.role || user.role === query.role)
      && (!query.status || user.status === query.status)
      && (!query.joinedAfter || user.joinedAt >= query.joinedAfter)
      && (!query.joinedBefore || user.joinedAt <= query.joinedBefore);
  });

  return paginate(filtered, query);
}

export async function getUserDetails(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return null;
  }

  return {
    ...user,
    activeJobTitles: flaggedJobs.filter((job) => job.posterId === userId).map((job) => job.title),
    disputeHistory: disputes.filter((dispute) => dispute.clientId === userId || dispute.freelancerId === userId)
  };
}

export async function updateUserStatus(userId, status, adminId) {
  assertAllowed(status, ["active", "suspended", "banned"], "Unsupported user status");
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return null;
  }

  user.status = status;
  appendAudit(adminId, "user_status_updated", userId, `User set to ${status}`);
  return user;
}

export async function listFlaggedJobs(query = {}) {
  return paginate(flaggedJobs.filter((job) => !query.status || job.status === query.status), query);
}

export async function moderateJob(jobId, action, reason, adminId) {
  assertAllowed(action, ["approved", "rejected", "escalated"], "Unsupported moderation action");
  const job = flaggedJobs.find((item) => item.id === jobId);
  if (!job) {
    return null;
  }

  job.status = action;
  job.lastDecisionReason = reason || "";
  job.notificationQueued = action === "rejected";
  appendAudit(adminId, "listing_moderated", jobId, `${action}${reason ? `: ${reason}` : ""}`);
  return job;
}

export async function listDisputes(query = {}) {
  return paginate(disputes.filter((dispute) => !query.status || dispute.status === query.status), query);
}

export async function ruleOnDispute(disputeId, ruling, adminId) {
  assertAllowed(ruling, ["freelancer", "client", "refund", "escalated"], "Unsupported dispute ruling");
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    return null;
  }

  dispute.status = ruling === "escalated" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.notificationsQueued = [dispute.freelancerId, dispute.clientId];
  appendAudit(adminId, "dispute_ruled", disputeId, `Ruling: ${ruling}`);
  return dispute;
}

export async function getControls() {
  return Object.values(controls);
}

export async function updateControl(key, enabled, adminId) {
  const control = controls[key];
  if (!control) {
    return null;
  }

  control.enabled = Boolean(enabled);
  appendAudit(adminId, "platform_control_updated", key, `${control.label}: ${control.enabled ? "enabled" : "disabled"}`);
  return control;
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    return (!query.adminId || entry.adminId === query.adminId)
      && (!query.action || entry.action === query.action)
      && (!query.from || entry.createdAt >= query.from)
      && (!query.to || entry.createdAt <= query.to);
  });

  return paginate(filtered.toReversed(), query);
}

function appendAudit(adminId, action, target, note) {
  auditLog.push({
    id: `aud_${auditLog.length + 1}`,
    adminId,
    action,
    target,
    createdAt: new Date().toISOString(),
    note
  });
}

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function assertAllowed(value, allowed, message) {
  if (!allowed.includes(value)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}
