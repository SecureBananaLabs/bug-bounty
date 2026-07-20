const users = [
  {
    id: "usr_admin_1",
    fullName: "Avery Stone",
    email: "avery.admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04T09:30:00.000Z",
    activeJobs: 0,
    disputeCount: 0,
    trustScore: 96
  },
  {
    id: "usr_freelancer_1",
    fullName: "Maya Chen",
    email: "maya.dev@example.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14T12:15:00.000Z",
    activeJobs: 3,
    disputeCount: 1,
    trustScore: 88
  },
  {
    id: "usr_client_1",
    fullName: "Jordan Lee",
    email: "jordan.client@example.test",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-03T16:45:00.000Z",
    activeJobs: 2,
    disputeCount: 2,
    trustScore: 42
  },
  {
    id: "usr_freelancer_2",
    fullName: "Priya Singh",
    email: "priya.design@example.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-08T08:00:00.000Z",
    activeJobs: 1,
    disputeCount: 0,
    trustScore: 74
  },
  {
    id: "usr_client_2",
    fullName: "Nolan Brooks",
    email: "nolan.ops@example.test",
    role: "client",
    status: "banned",
    joinedAt: "2026-04-21T10:05:00.000Z",
    activeJobs: 0,
    disputeCount: 3,
    trustScore: 18
  }
];

const flaggedListings = [
  {
    id: "flag_1001",
    jobId: "job_901",
    title: "Urgent crypto recovery automation",
    clientName: "Jordan Lee",
    reason: "Payment-risk keywords and off-platform contact request",
    severity: "high",
    status: "pending",
    flaggedAt: "2026-05-16T11:20:00.000Z"
  },
  {
    id: "flag_1002",
    jobId: "job_902",
    title: "Rewrite SaaS onboarding",
    clientName: "Nolan Brooks",
    reason: "Duplicate listing reported by two freelancers",
    severity: "medium",
    status: "pending",
    flaggedAt: "2026-05-16T13:10:00.000Z"
  },
  {
    id: "flag_1003",
    jobId: "job_903",
    title: "Landing page QA pass",
    clientName: "Camila Gomez",
    reason: "Automated spam score above threshold",
    severity: "low",
    status: "escalated",
    flaggedAt: "2026-05-15T18:32:00.000Z"
  }
];

const disputes = [
  {
    id: "disp_2001",
    jobTitle: "AI support widget prototype",
    clientName: "Jordan Lee",
    freelancerName: "Maya Chen",
    amount: 1500,
    status: "open",
    openedAt: "2026-05-15T15:00:00.000Z",
    thread: [
      { author: "client", body: "The final handoff missed the analytics hook.", at: "2026-05-15T15:02:00.000Z" },
      { author: "freelancer", body: "Analytics was excluded from the paid scope.", at: "2026-05-15T15:08:00.000Z" }
    ],
    evidence: ["scope-agreement.pdf", "handoff-video.mp4"],
    transaction: { id: "pay_7781", status: "held", amount: 1500 }
  },
  {
    id: "disp_2002",
    jobTitle: "Legacy API migration",
    clientName: "Nolan Brooks",
    freelancerName: "Priya Singh",
    amount: 2800,
    status: "under_review",
    openedAt: "2026-05-12T09:00:00.000Z",
    thread: [
      { author: "freelancer", body: "The staging credentials stopped working during review.", at: "2026-05-12T09:04:00.000Z" }
    ],
    evidence: ["staging-error.png"],
    transaction: { id: "pay_7782", status: "held", amount: 2800 }
  }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-17T05:00:00.000Z"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-17T05:00:00.000Z"
  }
};

const notifications = [];

const auditLog = [
  {
    id: "audit_1",
    adminId: "system",
    actionType: "admin.panel.seeded",
    targetType: "platform",
    targetId: "admin",
    details: "Seeded admin dashboard queues for review",
    createdAt: "2026-05-17T05:00:00.000Z"
  }
];

function adminError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10) || 10, 1), 50);
  return { page, pageSize };
}

function paginate(rows, query) {
  const { page, pageSize } = parsePagination(query);
  const total = rows.length;
  const start = (page - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
}

function appendAudit(actionType, targetType, targetId, adminId, details) {
  const entry = {
    id: `audit_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function notify(userName, title, body) {
  notifications.unshift({
    id: `note_${Date.now()}_${notifications.length + 1}`,
    userName,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString()
  });
}

function trustDistribution() {
  return [
    { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length },
    { label: "60-79", count: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length },
    { label: "40-59", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 60).length },
    { label: "0-39", count: users.filter((user) => user.trustScore < 40).length }
  ];
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status === "pending").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: trustDistribution()
  };
}

export async function getAdminOverview() {
  return {
    metrics: await getAdminMetrics(),
    controls: Object.values(platformControls),
    recentAudit: auditLog.slice(0, 5),
    notifications: notifications.slice(0, 5),
    refreshedAt: new Date().toISOString()
  };
}

export async function listUsers(query = {}) {
  const search = normalize(query.search);
  const role = normalize(query.role);
  const status = normalize(query.status);
  const joinedFrom = query.joinedFrom ? new Date(query.joinedFrom) : null;
  const joinedTo = query.joinedTo ? new Date(query.joinedTo) : null;

  const filtered = users.filter((user) => {
    const joinedAt = new Date(user.joinedAt);
    const matchesSearch =
      !search ||
      normalize(user.fullName).includes(search) ||
      normalize(user.email).includes(search) ||
      normalize(user.id).includes(search);
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    const matchesFrom = !joinedFrom || joinedAt >= joinedFrom;
    const matchesTo = !joinedTo || joinedAt <= joinedTo;
    return matchesSearch && matchesRole && matchesStatus && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}

export async function setUserStatus(userId, payload = {}, adminId) {
  const nextStatus = normalize(payload.status);
  if (!["active", "suspended", "banned"].includes(nextStatus)) {
    throw adminError("Invalid user status");
  }

  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw adminError("User not found", 404);
  }

  user.status = nextStatus;
  const actionType = nextStatus === "active" ? "user.reinstated" : `user.${nextStatus}`;
  const audit = appendAudit(actionType, "user", userId, adminId, `Set ${user.fullName} to ${nextStatus}`);
  notify(user.fullName, "Account status updated", `Your FreelanceFlow account is now ${nextStatus}.`);

  return { user, audit };
}

export async function listFlaggedListings(query = {}) {
  const status = normalize(query.status);
  const severity = normalize(query.severity);
  const search = normalize(query.search);

  const filtered = flaggedListings.filter((listing) => {
    const matchesStatus = !status || listing.status === status;
    const matchesSeverity = !severity || listing.severity === severity;
    const matchesSearch =
      !search ||
      normalize(listing.title).includes(search) ||
      normalize(listing.clientName).includes(search) ||
      normalize(listing.reason).includes(search);
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  return paginate(filtered, query);
}

export async function decideFlaggedListing(listingId, payload = {}, adminId) {
  const decision = normalize(payload.decision);
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw adminError("Invalid listing decision");
  }

  const listing = flaggedListings.find((item) => item.id === listingId);
  if (!listing) {
    throw adminError("Flagged listing not found", 404);
  }

  listing.status = decision;
  listing.resolutionReason = payload.reason ?? "";
  listing.decidedAt = new Date().toISOString();

  if (decision === "rejected") {
    notify(
      listing.clientName,
      "Listing rejected",
      `Your listing "${listing.title}" was rejected. Reason: ${listing.resolutionReason || "policy review"}.`
    );
  }

  const audit = appendAudit(
    `listing.${decision}`,
    "flagged_listing",
    listingId,
    adminId,
    `${decision} listing "${listing.title}"`
  );

  return { listing, audit };
}

export async function listDisputes(query = {}) {
  const status = normalize(query.status);
  const search = normalize(query.search);

  const filtered = disputes.filter((dispute) => {
    const matchesStatus = !status || dispute.status === status;
    const matchesSearch =
      !search ||
      normalize(dispute.jobTitle).includes(search) ||
      normalize(dispute.clientName).includes(search) ||
      normalize(dispute.freelancerName).includes(search);
    return matchesStatus && matchesSearch;
  });

  return paginate(filtered, query);
}

export async function ruleOnDispute(disputeId, payload = {}, adminId) {
  const ruling = normalize(payload.ruling);
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw adminError("Invalid dispute ruling");
  }

  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw adminError("Dispute not found", 404);
  }

  if (ruling === "escalate") {
    dispute.status = "under_review";
    dispute.escalatedTo = payload.escalateTo ?? "senior_admin";
  } else {
    dispute.status = "resolved";
    dispute.ruling = ruling;
    dispute.transaction.status = ruling === "client" ? "refund_pending" : "release_pending";
  }

  dispute.rulingNotes = payload.notes ?? "";
  dispute.decidedAt = new Date().toISOString();
  notify(dispute.clientName, "Dispute ruling updated", `The dispute for "${dispute.jobTitle}" was updated.`);
  notify(dispute.freelancerName, "Dispute ruling updated", `The dispute for "${dispute.jobTitle}" was updated.`);

  const audit = appendAudit(
    ruling === "escalate" ? "dispute.escalated" : "dispute.resolved",
    "dispute",
    disputeId,
    adminId,
    `Ruling for ${dispute.jobTitle}: ${ruling}`
  );

  return { dispute, audit };
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function setPlatformControl(key, payload = {}, adminId) {
  const control = platformControls[key];
  if (!control) {
    throw adminError("Platform control not found", 404);
  }

  if (typeof payload.enabled !== "boolean") {
    throw adminError("Control enabled value must be boolean");
  }

  control.enabled = payload.enabled;
  control.updatedBy = adminId;
  control.updatedAt = new Date().toISOString();

  const audit = appendAudit(
    "platform.control_updated",
    "platform_control",
    key,
    adminId,
    `${control.label} set to ${payload.enabled ? "enabled" : "disabled"}`
  );

  return { control, audit };
}

export async function getAuditLog(query = {}) {
  const admin = normalize(query.adminId);
  const actionType = normalize(query.actionType);
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
  const dateTo = query.dateTo ? new Date(query.dateTo) : null;

  const filtered = auditLog.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    const matchesAdmin = !admin || normalize(entry.adminId).includes(admin);
    const matchesAction = !actionType || normalize(entry.actionType) === actionType;
    const matchesFrom = !dateFrom || createdAt >= dateFrom;
    const matchesTo = !dateTo || createdAt <= dateTo;
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}
