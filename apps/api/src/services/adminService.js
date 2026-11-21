const users = [
  {
    id: "usr_01",
    name: "Nadia Chen",
    email: "nadia@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-03-11",
    activeJobs: 3,
    disputes: 0,
    trustScore: 92
  },
  {
    id: "usr_02",
    name: "Maya Iyer",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-19",
    activeJobs: 4,
    disputes: 1,
    trustScore: 88
  },
  {
    id: "usr_03",
    name: "Jordan Vale",
    email: "jordan@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-03",
    activeJobs: 2,
    disputes: 1,
    trustScore: 77
  },
  {
    id: "usr_04",
    name: "Owen Park",
    email: "owen@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-29",
    activeJobs: 5,
    disputes: 0,
    trustScore: 95
  },
  {
    id: "usr_05",
    name: "Rhea Singh",
    email: "rhea@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-21",
    activeJobs: 1,
    disputes: 2,
    trustScore: 51
  }
];

const moderationQueue = [
  {
    id: "job_201",
    title: "Scrape gated lead database",
    reporter: "automated-policy",
    status: "flagged",
    severity: "high",
    ownerId: "usr_05",
    reason: "Potential terms-of-service violation"
  },
  {
    id: "job_202",
    title: "Landing page rebuild",
    reporter: "client-report",
    status: "under_review",
    severity: "medium",
    ownerId: "usr_01",
    reason: "Scope mismatch reported by freelancer"
  }
];

const disputes = [
  {
    id: "dsp_301",
    jobTitle: "Mobile checkout polish",
    clientId: "usr_01",
    freelancerId: "usr_03",
    amount: 1200,
    status: "open",
    evidenceCount: 4,
    summary: "Client says milestone build is incomplete; freelancer uploaded delivery proof."
  },
  {
    id: "dsp_302",
    jobTitle: "API migration",
    clientId: "usr_05",
    freelancerId: "usr_02",
    amount: 2800,
    status: "under_review",
    evidenceCount: 7,
    summary: "Payment release paused while logs and acceptance criteria are reviewed."
  }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-18T10:00:00.000Z",
    updatedBy: "system"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-18T10:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLog = [
  {
    id: "aud_001",
    action: "moderation.reviewed",
    targetId: "job_202",
    adminId: "admin_seed",
    reason: "Initial seeded review",
    createdAt: "2026-05-18T10:00:00.000Z"
  }
];

const validUserStatuses = new Set(["active", "suspended", "banned"]);
const validModerationStatuses = new Set(["flagged", "approved", "rejected", "escalated", "under_review"]);
const validDisputeStatuses = new Set(["open", "under_review", "resolved", "escalated"]);

function paginate(items, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function normalizeNeedle(value) {
  return String(value ?? "").trim().toLowerCase();
}

function requireReason(reason) {
  if (!String(reason ?? "").trim()) {
    const error = new Error("A reason is required for this admin action");
    error.status = 400;
    throw error;
  }
}

function writeAudit({ action, targetId, admin, reason }) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    action,
    targetId,
    adminId: admin?.sub ?? "unknown_admin",
    reason,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function findOrFail(items, id, label) {
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    const error = new Error(`${label} not found`);
    error.status = 404;
    throw error;
  }
  return item;
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationQueue.filter((job) => job.status === "flagged").length;
  const activeJobs = users.reduce((sum, user) => sum + user.activeJobs, 0);

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length },
      { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { label: "0-69", count: users.filter((user) => user.trustScore < 70).length }
    ]
  };
}

export async function listAdminUsers(query = {}) {
  const search = normalizeNeedle(query.search);
  const filtered = users.filter((user) => {
    const roleMatch = query.role ? user.role === query.role : true;
    const statusMatch = query.status ? user.status === query.status : true;
    const searchMatch = search
      ? `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(search)
      : true;

    return roleMatch && statusMatch && searchMatch;
  });

  return paginate(filtered, query);
}

export async function changeUserStatus(userId, payload, admin) {
  requireReason(payload.reason);
  if (!validUserStatuses.has(payload.status)) {
    const error = new Error("Status must be active, suspended, or banned");
    error.status = 400;
    throw error;
  }

  const user = findOrFail(users, userId, "User");
  user.status = payload.status;
  user.statusReason = payload.reason;

  writeAudit({
    action: "user.status_changed",
    targetId: user.id,
    admin,
    reason: payload.reason
  });

  return user;
}

export async function listModerationQueue(query = {}) {
  const status = query.status;
  const filtered = moderationQueue.filter((job) => (status ? job.status === status : true));
  return paginate(filtered, query);
}

export async function updateModerationItem(jobId, payload, admin) {
  requireReason(payload.reason);
  if (!validModerationStatuses.has(payload.status)) {
    const error = new Error("Unsupported moderation status");
    error.status = 400;
    throw error;
  }

  const job = findOrFail(moderationQueue, jobId, "Moderation item");
  job.status = payload.status;
  job.decisionReason = payload.reason;

  writeAudit({
    action: "moderation.status_changed",
    targetId: job.id,
    admin,
    reason: payload.reason
  });

  return job;
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => (query.status ? dispute.status === query.status : true));
  return paginate(filtered, query);
}

export async function resolveDispute(disputeId, payload, admin) {
  requireReason(payload.reason);
  if (!validDisputeStatuses.has(payload.status)) {
    const error = new Error("Unsupported dispute status");
    error.status = 400;
    throw error;
  }

  const dispute = findOrFail(disputes, disputeId, "Dispute");
  dispute.status = payload.status;
  dispute.ruling = payload.ruling ?? "pending";
  dispute.resolution = payload.resolution ?? "";

  writeAudit({
    action: "dispute.status_changed",
    targetId: dispute.id,
    admin,
    reason: payload.reason
  });

  return dispute;
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function updatePlatformControl(controlKey, payload, admin) {
  requireReason(payload.reason);
  const control = platformControls[controlKey];
  if (!control) {
    const error = new Error("Platform control not found");
    error.status = 404;
    throw error;
  }

  control.enabled = Boolean(payload.enabled);
  control.updatedAt = new Date().toISOString();
  control.updatedBy = admin?.sub ?? "unknown_admin";
  control.reason = payload.reason;

  writeAudit({
    action: "platform_control.updated",
    targetId: control.key,
    admin,
    reason: payload.reason
  });

  return control;
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const actionMatch = query.action ? entry.action === query.action : true;
    const adminMatch = query.adminId ? entry.adminId === query.adminId : true;
    return actionMatch && adminMatch;
  });

  return paginate(filtered, query);
}
