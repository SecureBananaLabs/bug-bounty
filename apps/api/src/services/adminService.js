const users = [
  {
    id: "usr_admin_001",
    name: "Avery Admin",
    email: "avery.admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-04-20T10:15:00.000Z",
    trustScore: 96,
    activeJobs: [],
    disputeHistory: []
  },
  {
    id: "usr_client_101",
    name: "Nora Client",
    email: "nora.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-02T12:00:00.000Z",
    trustScore: 84,
    activeJobs: ["job_101", "job_103"],
    disputeHistory: ["dsp_501"]
  },
  {
    id: "usr_free_205",
    name: "Mika Freelancer",
    email: "mika.dev@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-04T09:30:00.000Z",
    trustScore: 91,
    activeJobs: ["job_101"],
    disputeHistory: []
  },
  {
    id: "usr_free_218",
    name: "Rae Design",
    email: "rae.design@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-09T15:45:00.000Z",
    trustScore: 42,
    activeJobs: [],
    disputeHistory: ["dsp_502"]
  },
  {
    id: "usr_client_122",
    name: "Sol Client",
    email: "sol.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-14T18:05:00.000Z",
    trustScore: 73,
    activeJobs: ["job_104"],
    disputeHistory: []
  }
];

const jobs = [
  {
    id: "job_101",
    title: "Build an AI customer support widget",
    posterId: "usr_client_101",
    status: "active",
    budget: 1500,
    flagged: false,
    reports: 0
  },
  {
    id: "job_102",
    title: "Clone a competitor website exactly",
    posterId: "usr_client_101",
    status: "flagged",
    budget: 650,
    flagged: true,
    reports: 4
  },
  {
    id: "job_103",
    title: "Migrate legacy API to Node.js",
    posterId: "usr_client_101",
    status: "active",
    budget: 2800,
    flagged: false,
    reports: 0
  },
  {
    id: "job_104",
    title: "Design SaaS onboarding flows",
    posterId: "usr_client_122",
    status: "flagged",
    budget: 900,
    flagged: true,
    reports: 2
  }
];

const moderationQueue = [
  {
    id: "mod_701",
    jobId: "job_102",
    title: "Clone a competitor website exactly",
    posterId: "usr_client_101",
    reason: "Potential intellectual-property violation",
    status: "pending",
    severity: "high",
    reportedAt: "2026-05-16T12:20:00.000Z"
  },
  {
    id: "mod_702",
    jobId: "job_104",
    title: "Design SaaS onboarding flows",
    posterId: "usr_client_122",
    reason: "Budget mismatch reported by freelancer",
    status: "pending",
    severity: "medium",
    reportedAt: "2026-05-16T16:40:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_501",
    clientId: "usr_client_101",
    freelancerId: "usr_free_205",
    jobId: "job_101",
    amount: 1500,
    status: "open",
    openedAt: "2026-05-15T08:10:00.000Z",
    transactionId: "txn_9001",
    thread: [
      { authorId: "usr_client_101", message: "Milestone build is incomplete.", createdAt: "2026-05-15T08:10:00.000Z" },
      { authorId: "usr_free_205", message: "The latest deployment includes the requested flow.", createdAt: "2026-05-15T09:00:00.000Z" }
    ],
    evidence: [
      { type: "url", label: "Preview deployment", value: "https://preview.freelanceflow.test/job_101" }
    ]
  },
  {
    id: "dsp_502",
    clientId: "usr_client_122",
    freelancerId: "usr_free_218",
    jobId: "job_104",
    amount: 900,
    status: "under_review",
    openedAt: "2026-05-16T11:25:00.000Z",
    transactionId: "txn_9002",
    thread: [
      { authorId: "usr_free_218", message: "Scope changed after work started.", createdAt: "2026-05-16T11:25:00.000Z" }
    ],
    evidence: [
      { type: "file", label: "Original scope PDF", value: "scope-job-104.pdf" }
    ]
  }
];

const notifications = [];
const auditLog = [
  {
    id: "aud_001",
    adminId: "usr_admin_001",
    action: "admin.metrics.viewed",
    targetType: "dashboard",
    targetId: "admin",
    details: "Seed audit entry for dashboard verification",
    createdAt: "2026-05-16T10:00:00.000Z"
  }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-15T10:00:00.000Z",
    updatedBy: "usr_admin_001"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-15T10:00:00.000Z",
    updatedBy: "usr_admin_001"
  }
};

function now() {
  return new Date().toISOString();
}

function getAdminId(admin) {
  return admin?.sub ?? admin?.id ?? "unknown-admin";
}

function appendAudit(admin, action, targetType, targetId, details) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId: getAdminId(admin),
    action,
    targetType,
    targetId,
    details,
    createdAt: now()
  };
  auditLog.push(entry);
  return entry;
}

function toPositiveInteger(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function paginate(items, query = {}) {
  const page = toPositiveInteger(query.page, 1, 1000);
  const pageSize = toPositiveInteger(query.pageSize, 10, 50);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages
  };
}

function textMatches(value, search) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

function dateBoundary(value, boundary) {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const normalized = dateOnly ? `${value}T${boundary === "end" ? "23:59:59.999" : "00:00:00.000"}Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function requireKnownUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return user;
}

function requireQueueItem(itemId) {
  const item = moderationQueue.find((candidate) => candidate.id === itemId);
  if (!item) {
    const error = new Error("Moderation item not found");
    error.status = 404;
    throw error;
  }
  return item;
}

function requireDispute(disputeId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    const error = new Error("Dispute not found");
    error.status = 404;
    throw error;
  }
  return dispute;
}

function buildTrustDistribution() {
  const buckets = [
    { label: "0-49", min: 0, max: 49, count: 0 },
    { label: "50-69", min: 50, max: 69, count: 0 },
    { label: "70-89", min: 70, max: 89, count: 0 },
    { label: "90-100", min: 90, max: 100, count: 0 }
  ];

  for (const user of users) {
    const bucket = buckets.find((candidate) => user.trustScore >= candidate.min && user.trustScore <= candidate.max);
    if (bucket) bucket.count += 1;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

export async function getAdminMetrics(admin) {
  const data = {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "active").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((item) => item.status === "pending").length,
    revenueCurrentPeriod: jobs.reduce((sum, job) => sum + job.budget, 0),
    trustDistribution: buildTrustDistribution(),
    controls: Object.values(platformControls)
  };

  appendAudit(admin, "admin.metrics.viewed", "dashboard", "admin", "Viewed admin dashboard metrics");
  return data;
}

export async function listAdminUsers(query = {}) {
  let results = [...users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  const { search, role, status, joinedAfter, joinedBefore } = query;

  if (search) {
    results = results.filter((user) => textMatches(user.name, search) || textMatches(user.email, search) || textMatches(user.id, search));
  }
  if (role) {
    results = results.filter((user) => user.role === role);
  }
  if (status) {
    results = results.filter((user) => user.status === status);
  }
  if (joinedAfter) {
    const lowerBound = dateBoundary(joinedAfter, "start");
    if (lowerBound) results = results.filter((user) => user.joinedAt >= lowerBound);
  }
  if (joinedBefore) {
    const upperBound = dateBoundary(joinedBefore, "end");
    if (upperBound) results = results.filter((user) => user.joinedAt <= upperBound);
  }

  return paginate(results, query);
}

export async function getAdminUserProfile(userId) {
  const user = requireKnownUser(userId);
  return {
    ...user,
    activeJobs: jobs.filter((job) => user.activeJobs.includes(job.id)),
    disputeHistory: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function updateAdminUserStatus(admin, userId, payload = {}) {
  const allowedStatuses = new Set(["active", "suspended", "banned"]);
  const status = payload.status;
  if (!allowedStatuses.has(status)) {
    const error = new Error("Status must be active, suspended, or banned");
    error.status = 400;
    throw error;
  }

  const user = requireKnownUser(userId);
  const previousStatus = user.status;
  user.status = status;
  user.statusReason = payload.reason ?? "";
  user.updatedAt = now();

  const audit = appendAudit(
    admin,
    `admin.user.${status}`,
    "user",
    user.id,
    `Changed user status from ${previousStatus} to ${status}${payload.reason ? `: ${payload.reason}` : ""}`
  );

  return { user, audit };
}

export async function listModerationQueue(query = {}) {
  let results = [...moderationQueue].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  if (query.status) {
    results = results.filter((item) => item.status === query.status);
  }
  if (query.severity) {
    results = results.filter((item) => item.severity === query.severity);
  }
  return paginate(results, query);
}

export async function decideModerationItem(admin, itemId, payload = {}) {
  const allowedDecisions = new Set(["approve", "reject", "escalate"]);
  if (!allowedDecisions.has(payload.decision)) {
    const error = new Error("Decision must be approve, reject, or escalate");
    error.status = 400;
    throw error;
  }

  const item = requireQueueItem(itemId);
  const job = jobs.find((candidate) => candidate.id === item.jobId);
  item.status = payload.decision === "approve" ? "approved" : payload.decision === "reject" ? "rejected" : "escalated";
  item.resolutionReason = payload.reason ?? "";
  item.resolvedAt = now();
  item.resolvedBy = getAdminId(admin);

  if (job) {
    job.status = item.status === "approved" ? "active" : item.status;
    job.flagged = item.status === "escalated";
  }

  let notification = null;
  if (payload.decision === "reject") {
    notification = {
      id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
      userId: item.posterId,
      type: "listing_rejected",
      message: `Your listing "${item.title}" was rejected${payload.reason ? `: ${payload.reason}` : "."}`,
      createdAt: now()
    };
    notifications.push(notification);
  }

  const audit = appendAudit(
    admin,
    `admin.moderation.${payload.decision}`,
    "moderation",
    item.id,
    `${payload.decision} listing ${item.jobId}${payload.reason ? `: ${payload.reason}` : ""}`
  );

  return { item, job, notification, audit };
}

export async function listDisputes(query = {}) {
  let results = [...disputes].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  if (query.status) {
    results = results.filter((dispute) => dispute.status === query.status);
  }
  return paginate(results, query);
}

export async function getDisputeDetails(disputeId) {
  const dispute = requireDispute(disputeId);
  return {
    ...dispute,
    client: requireKnownUser(dispute.clientId),
    freelancer: requireKnownUser(dispute.freelancerId),
    job: jobs.find((candidate) => candidate.id === dispute.jobId)
  };
}

export async function ruleOnDispute(admin, disputeId, payload = {}) {
  const allowedRulings = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!allowedRulings.has(payload.ruling)) {
    const error = new Error("Ruling must be client, freelancer, refund, or escalate");
    error.status = 400;
    throw error;
  }

  const dispute = requireDispute(disputeId);
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingReason = payload.reason ?? "";
  dispute.resolvedAt = payload.ruling === "escalate" ? undefined : now();
  dispute.reviewedBy = getAdminId(admin);
  dispute.financialAction = payload.ruling === "refund" ? { type: "refund", amount: dispute.amount, transactionId: dispute.transactionId } : null;

  notifications.push(
    {
      id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
      userId: dispute.clientId,
      type: "dispute_ruling",
      message: `Dispute ${dispute.id} updated: ${payload.ruling}`,
      createdAt: now()
    },
    {
      id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
      userId: dispute.freelancerId,
      type: "dispute_ruling",
      message: `Dispute ${dispute.id} updated: ${payload.ruling}`,
      createdAt: now()
    }
  );

  const audit = appendAudit(
    admin,
    `admin.dispute.${payload.ruling}`,
    "dispute",
    dispute.id,
    `${payload.ruling} ruling${payload.reason ? `: ${payload.reason}` : ""}`
  );

  return { dispute, audit };
}

export async function listAuditLog(query = {}) {
  let results = [...auditLog].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (query.adminId) {
    results = results.filter((entry) => entry.adminId === query.adminId);
  }
  if (query.action) {
    results = results.filter((entry) => entry.action === query.action || entry.action.startsWith(`${query.action}.`));
  }
  if (query.from) {
    const lowerBound = dateBoundary(query.from, "start");
    if (lowerBound) results = results.filter((entry) => entry.createdAt >= lowerBound);
  }
  if (query.to) {
    const upperBound = dateBoundary(query.to, "end");
    if (upperBound) results = results.filter((entry) => entry.createdAt <= upperBound);
  }
  return paginate(results, query);
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function updatePlatformControl(admin, controlKey, payload = {}) {
  const control = platformControls[controlKey];
  if (!control) {
    const error = new Error("Platform control not found");
    error.status = 404;
    throw error;
  }
  if (typeof payload.enabled !== "boolean") {
    const error = new Error("enabled must be a boolean");
    error.status = 400;
    throw error;
  }
  if (!payload.confirmed) {
    const error = new Error("Confirmation is required before changing a platform control");
    error.status = 400;
    throw error;
  }

  const previousValue = control.enabled;
  control.enabled = payload.enabled;
  control.updatedAt = now();
  control.updatedBy = getAdminId(admin);

  const audit = appendAudit(
    admin,
    "admin.control.updated",
    "platform_control",
    control.key,
    `Changed ${control.label} from ${previousValue ? "enabled" : "disabled"} to ${control.enabled ? "enabled" : "disabled"}`
  );

  return { control, audit };
}

export function __resetAdminStateForTests() {
  users.find((user) => user.id === "usr_free_218").status = "suspended";
  const mod = moderationQueue.find((item) => item.id === "mod_701");
  mod.status = "pending";
  mod.resolutionReason = "";
  mod.resolvedAt = undefined;
  mod.resolvedBy = undefined;
  const dispute = disputes.find((item) => item.id === "dsp_501");
  dispute.status = "open";
  dispute.ruling = undefined;
  dispute.rulingReason = "";
  dispute.resolvedAt = undefined;
  dispute.reviewedBy = undefined;
  dispute.financialAction = null;
  platformControls.registrations.enabled = true;
  platformControls.jobPostings.enabled = true;
  notifications.length = 0;
  auditLog.splice(1);
}
