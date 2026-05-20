const users = [
  {
    id: "usr_client_01",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-12",
    trustScore: 82,
    activeJobs: 3,
    disputes: 1,
    profile: "Enterprise client with three active product workstreams."
  },
  {
    id: "usr_freelancer_01",
    name: "Maya Developer",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-04",
    trustScore: 94,
    activeJobs: 5,
    disputes: 0,
    profile: "Verified freelancer focused on full-stack delivery."
  },
  {
    id: "usr_client_02",
    name: "Jordan Studio",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-19",
    trustScore: 41,
    activeJobs: 1,
    disputes: 2,
    profile: "Client account under review after repeated dispute escalations."
  }
];

const flaggedJobs = [
  {
    id: "job_flagged_01",
    title: "Scrape competitor leads at scale",
    clientId: "usr_client_02",
    reason: "Automated policy review",
    risk: "high",
    status: "pending",
    reportedAt: "2026-05-18T09:00:00.000Z"
  },
  {
    id: "job_flagged_02",
    title: "Payment gateway integration review",
    clientId: "usr_client_01",
    reason: "User report",
    risk: "medium",
    status: "pending",
    reportedAt: "2026-05-19T13:30:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_01",
    clientId: "usr_client_01",
    freelancerId: "usr_freelancer_01",
    status: "open",
    amount: 1200,
    thread: [
      "Client says milestone scope was missed.",
      "Freelancer attached delivery evidence and acceptance notes."
    ],
    evidence: ["milestone-contract.pdf", "delivery-record.txt"],
    transactionId: "pay_123"
  },
  {
    id: "dsp_02",
    clientId: "usr_client_02",
    freelancerId: "usr_freelancer_01",
    status: "under_review",
    amount: 450,
    thread: ["Client requested refund after late delivery."],
    evidence: ["chat-export.txt"],
    transactionId: "pay_456"
  }
];

const controls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "aud_001",
    adminId: "system",
    action: "admin_panel_seeded",
    targetType: "system",
    targetId: "admin",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status === "pending").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { label: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ]
  };
}

export async function listUsers(query = {}) {
  const filtered = users.filter((user) => {
    const matchesSearch = !query.search || [user.name, user.email, user.id]
      .some((value) => value.toLowerCase().includes(String(query.search).toLowerCase()));
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const joinedAfter = !query.joinedAfter || new Date(user.joinedAt) >= new Date(query.joinedAfter);

    return matchesSearch && matchesRole && matchesStatus && joinedAfter;
  });

  return paginate(filtered, query);
}

export async function setUserStatus({ userId, status, adminId }) {
  assertOneOf(status, ["active", "suspended", "banned"], "user status");
  const user = findById(users, userId, "user");
  user.status = status;
  appendAudit(adminId, "user_status_changed", "user", userId, { status });

  return user;
}

export async function listFlaggedJobs(query = {}) {
  const filtered = flaggedJobs.filter((job) => (
    (!query.status || job.status === query.status) &&
    (!query.risk || job.risk === query.risk)
  ));

  return paginate(filtered, query);
}

export async function moderateJob({ jobId, decision, reason, adminId }) {
  assertOneOf(decision, ["approved", "rejected", "escalated"], "moderation decision");
  const job = findById(flaggedJobs, jobId, "flagged job");
  job.status = decision;
  job.moderationReason = reason ?? "";
  job.notification = decision === "rejected"
    ? `Listing rejected: ${job.moderationReason || "No reason provided"}`
    : null;
  appendAudit(adminId, "flagged_job_moderated", "job", jobId, { decision, reason });

  return job;
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function ruleDispute({ disputeId, ruling, adminId }) {
  assertOneOf(ruling, ["client", "freelancer", "refund", "escalated"], "dispute ruling");
  const dispute = findById(disputes, disputeId, "dispute");
  dispute.status = ruling === "escalated" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.notification = `Dispute ${disputeId} was ruled for ${ruling}`;
  appendAudit(adminId, "dispute_ruled", "dispute", disputeId, { ruling });

  return dispute;
}

export async function getControls() {
  return controls;
}

export async function setControl({ key, enabled, adminId }) {
  if (!Object.hasOwn(controls, key)) {
    throw createAdminError(`Unknown platform control: ${key}`, 404);
  }

  if (typeof enabled !== "boolean") {
    throw createAdminError("Platform control value must be a boolean");
  }

  controls[key] = enabled;
  appendAudit(adminId, "platform_control_changed", "control", key, { enabled });

  return { key, enabled };
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => (
    (!query.adminId || entry.adminId === query.adminId) &&
    (!query.action || entry.action === query.action) &&
    (!query.createdAfter || new Date(entry.createdAt) >= new Date(query.createdAfter)) &&
    (!query.createdBefore || new Date(entry.createdAt) <= new Date(query.createdBefore))
  ));

  return paginate(filtered, query);
}

function paginate(items, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: items.length,
    items: items.slice(start, start + pageSize)
  };
}

function findById(collection, id, label) {
  const item = collection.find((entry) => entry.id === id);
  if (!item) {
    throw createAdminError(`Unknown ${label}: ${id}`, 404);
  }

  return item;
}

function assertOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw createAdminError(`Invalid ${label}: ${value}`);
  }
}

function createAdminError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function appendAudit(adminId, action, targetType, targetId, details = {}) {
  auditLog.unshift({
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  });
}
