const initialUsers = [
  {
    id: "usr_101",
    name: "Maya Chen",
    email: "maya@example.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12T10:30:00.000Z",
    trustScore: 92,
    activeJobs: ["job_301"],
    disputeIds: ["dsp_501"]
  },
  {
    id: "usr_102",
    name: "Jordan Lee",
    email: "jordan@example.test",
    role: "client",
    status: "active",
    joinedAt: "2026-02-18T14:05:00.000Z",
    trustScore: 81,
    activeJobs: ["job_302"],
    disputeIds: []
  },
  {
    id: "usr_103",
    name: "Priya Nair",
    email: "priya@example.test",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-07T08:45:00.000Z",
    trustScore: 48,
    activeJobs: [],
    disputeIds: ["dsp_502"]
  },
  {
    id: "usr_104",
    name: "Alex Rivera",
    email: "alex@example.test",
    role: "client",
    status: "active",
    joinedAt: "2026-04-22T16:20:00.000Z",
    trustScore: 76,
    activeJobs: ["job_303"],
    disputeIds: []
  },
  {
    id: "usr_105",
    name: "Noah Smith",
    email: "noah@example.test",
    role: "freelancer",
    status: "banned",
    joinedAt: "2026-01-28T09:15:00.000Z",
    trustScore: 19,
    activeJobs: [],
    disputeIds: ["dsp_503"]
  }
];

const initialFlaggedListings = [
  {
    id: "flag_401",
    jobId: "job_301",
    title: "Build payment reconciliation dashboard",
    postedBy: "usr_102",
    reason: "Automated policy match: payment outside escrow",
    status: "pending",
    severity: "high",
    reportedAt: "2026-05-23T09:15:00.000Z"
  },
  {
    id: "flag_402",
    jobId: "job_302",
    title: "Migrate marketplace search to OpenSearch",
    postedBy: "usr_104",
    reason: "User report: misleading budget range",
    status: "pending",
    severity: "medium",
    reportedAt: "2026-05-23T10:40:00.000Z"
  },
  {
    id: "flag_403",
    jobId: "job_303",
    title: "Create brand kit and landing copy",
    postedBy: "usr_102",
    reason: "Automated policy match: duplicate listing",
    status: "escalated",
    severity: "low",
    reportedAt: "2026-05-22T18:05:00.000Z"
  }
];

const initialDisputes = [
  {
    id: "dsp_501",
    jobId: "job_301",
    jobTitle: "Build payment reconciliation dashboard",
    clientId: "usr_102",
    freelancerId: "usr_101",
    status: "open",
    amount: 2400,
    transactionId: "txn_901",
    thread: [
      "Client says milestone was incomplete.",
      "Freelancer provided deployment logs and screenshots."
    ],
    evidence: ["deployment-log.txt", "milestone-screenshot.png"],
    openedAt: "2026-05-21T12:00:00.000Z"
  },
  {
    id: "dsp_502",
    jobId: "job_304",
    jobTitle: "Refactor mobile onboarding",
    clientId: "usr_104",
    freelancerId: "usr_103",
    status: "under_review",
    amount: 900,
    transactionId: "txn_902",
    thread: ["Client reported missed acceptance criteria.", "Freelancer requested senior review."],
    evidence: ["brief.pdf", "handoff.zip"],
    openedAt: "2026-05-20T15:20:00.000Z"
  },
  {
    id: "dsp_503",
    jobId: "job_305",
    jobTitle: "Security review for SaaS API",
    clientId: "usr_102",
    freelancerId: "usr_105",
    status: "resolved",
    amount: 1200,
    transactionId: "txn_903",
    ruling: "client",
    thread: ["Refund approved after missing deliverables."],
    evidence: ["scope.md"],
    openedAt: "2026-05-18T11:35:00.000Z"
  }
];

const initialControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-23T07:00:00.000Z",
    updatedBy: "adm_001"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-23T07:00:00.000Z",
    updatedBy: "adm_001"
  }
};

let users;
let flaggedListings;
let disputes;
let controls;
let auditLog;
let notifications;

export class AdminServiceError extends Error {
  constructor(message, statusCode = 400, code = "admin_error") {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function resetAdminStateForTests() {
  users = structuredClone(initialUsers);
  flaggedListings = structuredClone(initialFlaggedListings);
  disputes = structuredClone(initialDisputes);
  controls = structuredClone(initialControls);
  notifications = [];
  auditLog = [
    {
      id: "aud_001",
      adminId: "adm_001",
      action: "platform.audit_seeded",
      targetId: "system",
      createdAt: "2026-05-23T07:00:00.000Z",
      details: { source: "initial-state" }
    }
  ];
}

resetAdminStateForTests();

function now() {
  return new Date().toISOString();
}

function assertOneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new AdminServiceError(`${field} must be one of: ${allowed.join(", ")}`, 400, `invalid_${field}`);
  }
}

function addAudit(adminId, action, targetId, details = {}) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    action,
    targetId,
    createdAt: now(),
    details
  };
  auditLog.unshift(entry);
  return entry;
}

function addNotification(userId, type, message, metadata = {}) {
  const notification = {
    id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
    userId,
    type,
    message,
    metadata,
    createdAt: now()
  };
  notifications.unshift(notification);
  return notification;
}

function paginationFromQuery(query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? "10", 10) || 10, 1), 50);
  return { page, limit };
}

function paginate(items, query) {
  const { page, limit } = paginationFromQuery(query);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, totalPages }
  };
}

function findUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new AdminServiceError("User not found", 404, "user_not_found");
  }
  return user;
}

function trustDistribution() {
  return [
    { range: "0-39", count: users.filter((user) => user.trustScore < 40).length },
    { range: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
    { range: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((count, user) => count + user.activeJobs.length, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status === "pending").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: trustDistribution(),
    controls: Object.values(controls),
    refreshedAt: now()
  };
}

export async function listUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const joinedAfter = !query.joinedAfter || new Date(user.joinedAt) >= new Date(query.joinedAfter);
    const joinedBefore = !query.joinedBefore || new Date(user.joinedAt) <= new Date(query.joinedBefore);

    return matchesSearch && matchesRole && matchesStatus && joinedAfter && joinedBefore;
  });

  return paginate(filtered, query);
}

export async function getUserDetails(userId) {
  const user = findUser(userId);
  return {
    ...user,
    disputes: disputes.filter((dispute) => user.disputeIds.includes(dispute.id)),
    flaggedListings: flaggedListings.filter((listing) => listing.postedBy === user.id)
  };
}

export async function updateUserStatus(userId, { status, reason, adminId }) {
  assertOneOf(status, ["active", "suspended", "banned"], "status");

  const user = findUser(userId);
  const previousStatus = user.status;
  user.status = status;

  const audit = addAudit(adminId, "user.status_changed", userId, {
    previousStatus,
    status,
    reason: reason ?? ""
  });

  addNotification(userId, "account_status", `Your account status changed to ${status}.`, {
    reason: reason ?? ""
  });

  return { user, audit };
}

export async function listFlaggedListings(query = {}) {
  const filtered = flaggedListings.filter((listing) => {
    const matchesStatus = !query.status || listing.status === query.status;
    const matchesSeverity = !query.severity || listing.severity === query.severity;
    return matchesStatus && matchesSeverity;
  });
  return paginate(filtered, query);
}

export async function moderateListing(listingId, { decision, reason, adminId }) {
  assertOneOf(decision, ["approve", "reject", "escalate"], "decision");

  const listing = flaggedListings.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw new AdminServiceError("Flagged listing not found", 404, "listing_not_found");
  }

  const statusByDecision = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  listing.status = statusByDecision[decision];
  listing.reviewedAt = now();
  listing.reviewedBy = adminId;
  listing.resolutionReason = reason ?? "";

  const audit = addAudit(adminId, `listing.${decision}`, listingId, {
    jobId: listing.jobId,
    reason: reason ?? ""
  });

  if (decision === "reject") {
    addNotification(listing.postedBy, "listing_rejected", `Listing rejected: ${reason ?? "policy review"}`, {
      jobId: listing.jobId
    });
  }

  return { listing, audit };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function ruleOnDispute(disputeId, { ruling, notes, adminId }) {
  assertOneOf(ruling, ["client", "freelancer", "refund", "escalate"], "ruling");

  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new AdminServiceError("Dispute not found", 404, "dispute_not_found");
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionNotes = notes ?? "";
  dispute.resolvedAt = ruling === "escalate" ? undefined : now();
  dispute.reviewedBy = adminId;

  const audit = addAudit(adminId, "dispute.ruling", disputeId, {
    ruling,
    notes: notes ?? "",
    transactionId: dispute.transactionId
  });

  addNotification(dispute.clientId, "dispute_update", `Dispute ${dispute.id} ruling: ${ruling}`, {
    disputeId
  });
  addNotification(dispute.freelancerId, "dispute_update", `Dispute ${dispute.id} ruling: ${ruling}`, {
    disputeId
  });

  return { dispute, audit };
}

export async function getPlatformControls() {
  return Object.values(controls);
}

export async function updatePlatformControl(controlKey, { enabled, adminId }) {
  if (!Object.hasOwn(controls, controlKey)) {
    throw new AdminServiceError("Platform control not found", 404, "control_not_found");
  }

  if (typeof enabled !== "boolean") {
    throw new AdminServiceError("enabled must be a boolean", 400, "invalid_enabled");
  }

  const control = controls[controlKey];
  const previousValue = control.enabled;
  control.enabled = enabled;
  control.updatedAt = now();
  control.updatedBy = adminId;

  const audit = addAudit(adminId, "platform.control_toggled", controlKey, {
    previousValue,
    enabled
  });

  return { control, audit };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action === query.action;
    const after = !query.after || new Date(entry.createdAt) >= new Date(query.after);
    const before = !query.before || new Date(entry.createdAt) <= new Date(query.before);
    return matchesAdmin && matchesAction && after && before;
  });

  return paginate(filtered, query);
}
