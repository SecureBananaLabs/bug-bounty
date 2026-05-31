const users = [
  {
    id: "usr_admin_1",
    email: "admin@example.com",
    fullName: "Avery Stone",
    role: "admin",
    status: "active",
    joinedAt: "2025-11-15T09:00:00.000Z",
    trustScore: 98,
    location: "New York, NY"
  },
  {
    id: "usr_freelancer_1",
    email: "maya@example.com",
    fullName: "Maya Chen",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-11T10:30:00.000Z",
    trustScore: 92,
    location: "Austin, TX"
  },
  {
    id: "usr_freelancer_2",
    email: "leo@example.com",
    fullName: "Leo Martin",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-01-22T15:45:00.000Z",
    trustScore: 46,
    location: "Toronto, CA"
  },
  {
    id: "usr_client_1",
    email: "olivia@example.com",
    fullName: "Olivia Grant",
    role: "client",
    status: "active",
    joinedAt: "2026-03-08T12:00:00.000Z",
    trustScore: 87,
    location: "Seattle, WA"
  },
  {
    id: "usr_client_2",
    email: "noah@example.com",
    fullName: "Noah Price",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02T08:15:00.000Z",
    trustScore: 64,
    location: "Chicago, IL"
  }
];

const jobs = [
  {
    id: "job_active_1",
    title: "Build a marketplace analytics dashboard",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    budget: 2800,
    createdAt: "2026-04-10T14:00:00.000Z"
  },
  {
    id: "job_active_2",
    title: "Design mobile onboarding flows",
    clientId: "usr_client_2",
    freelancerId: null,
    status: "open",
    budget: 1500,
    createdAt: "2026-04-20T09:20:00.000Z"
  },
  {
    id: "flagged_job_1",
    title: "Payment integration review",
    clientId: "usr_client_1",
    freelancerId: null,
    status: "open",
    budget: 900,
    moderationStatus: "flagged",
    flagReason: "Escrow bypass language detected",
    reports: 3,
    automatedFlags: ["payment-policy"],
    createdAt: "2026-05-14T11:35:00.000Z",
    flaggedAt: "2026-05-16T09:00:00.000Z"
  },
  {
    id: "flagged_job_2",
    title: "Landing page copy refresh",
    clientId: "usr_client_2",
    freelancerId: null,
    status: "open",
    budget: 450,
    moderationStatus: "flagged",
    flagReason: "Multiple duplicate reports",
    reports: 2,
    automatedFlags: ["duplicate-content"],
    createdAt: "2026-05-12T13:05:00.000Z",
    flaggedAt: "2026-05-15T18:25:00.000Z"
  }
];

const disputes = [
  {
    id: "dispute_1",
    jobId: "flagged_job_1",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    openedAt: "2026-05-16T17:20:00.000Z",
    summary: "Client requested refund after the milestone delivery missed the agreed acceptance criteria.",
    thread: [
      {
        authorId: "usr_client_1",
        body: "The delivered integration does not connect to the sandbox account.",
        createdAt: "2026-05-16T17:22:00.000Z"
      },
      {
        authorId: "usr_freelancer_1",
        body: "The sandbox credentials failed during final verification; I uploaded logs.",
        createdAt: "2026-05-16T18:02:00.000Z"
      }
    ],
    evidence: [
      { id: "ev_1", label: "Milestone brief", type: "document" },
      { id: "ev_2", label: "Sandbox error log", type: "log" }
    ],
    transaction: {
      id: "txn_900",
      amount: 900,
      currency: "USD",
      escrowStatus: "held"
    },
    ruling: null,
    refundTriggered: false
  },
  {
    id: "dispute_2",
    jobId: "job_active_2",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    status: "under_review",
    openedAt: "2026-05-10T08:40:00.000Z",
    summary: "Freelancer disputes late payment release after client approved draft work.",
    thread: [],
    evidence: [],
    transaction: {
      id: "txn_451",
      amount: 450,
      currency: "USD",
      escrowStatus: "pending_release"
    },
    ruling: null,
    refundTriggered: false
  }
];

const payments = [
  { id: "pay_1", amount: 2800, createdAt: "2026-05-02T10:00:00.000Z" },
  { id: "pay_2", amount: 1500, createdAt: "2026-05-11T12:00:00.000Z" },
  { id: "pay_3", amount: 900, createdAt: "2026-05-16T16:00:00.000Z" }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    description: "Allow new clients and freelancers to create accounts.",
    enabled: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
    updatedBy: "system"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    description: "Allow clients to publish new job listings.",
    enabled: true,
    updatedAt: "2026-05-01T00:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLogs = [];
const notifications = [];

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parsePositiveInt(value, fallback, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function paginate(items, query = {}) {
  const page = parsePositiveInt(query.page, 1, 500);
  const pageSize = parsePositiveInt(query.pageSize, 10, 50);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

function getAdminId(adminUser) {
  return adminUser?.sub ?? adminUser?.id ?? "unknown_admin";
}

function appendAuditLog({ adminUser, actionType, targetType, targetId, summary, metadata = {} }) {
  const entry = {
    id: `audit_${auditLogs.length + 1}`,
    adminId: getAdminId(adminUser),
    actionType,
    targetType,
    targetId,
    summary,
    metadata,
    createdAt: new Date().toISOString()
  };

  auditLogs.unshift(entry);
  return entry;
}

function appendNotification({ userId, title, body, metadata = {} }) {
  const notification = {
    id: `note_${notifications.length + 1}`,
    userId,
    title,
    body,
    metadata,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.unshift(notification);
  return notification;
}

function findUser(id) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    throw createServiceError(404, "User not found");
  }

  return user;
}

function findJob(id) {
  const job = jobs.find((candidate) => candidate.id === id);
  if (!job) {
    throw createServiceError(404, "Listing not found");
  }

  return job;
}

function findDispute(id) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) {
    throw createServiceError(404, "Dispute not found");
  }

  return dispute;
}

function userMatchesSearch(user, search) {
  if (!search) {
    return true;
  }

  const needle = String(search).trim().toLowerCase();
  return [user.fullName, user.email, user.location]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle));
}

function normalizeRole(role) {
  return role ? String(role).toLowerCase() : undefined;
}

function normalizeStatus(status) {
  return status ? String(status).toLowerCase() : undefined;
}

function isOnOrAfter(isoDate, minimum) {
  return !minimum || new Date(isoDate) >= new Date(minimum);
}

function isOnOrBefore(isoDate, maximum) {
  return !maximum || new Date(isoDate) <= new Date(maximum);
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    joinedAt: user.joinedAt,
    trustScore: user.trustScore,
    location: user.location
  };
}

function serializeListing(job) {
  const poster = users.find((user) => user.id === job.clientId);
  return {
    id: job.id,
    title: job.title,
    clientId: job.clientId,
    clientName: poster?.fullName ?? "Unknown client",
    status: job.status,
    budget: job.budget,
    moderationStatus: job.moderationStatus ?? "approved",
    flagReason: job.flagReason ?? null,
    reports: job.reports ?? 0,
    automatedFlags: job.automatedFlags ?? [],
    createdAt: job.createdAt,
    flaggedAt: job.flaggedAt ?? null
  };
}

function serializeDispute(dispute) {
  const client = users.find((user) => user.id === dispute.clientId);
  const freelancer = users.find((user) => user.id === dispute.freelancerId);
  const job = jobs.find((candidate) => candidate.id === dispute.jobId);

  return {
    id: dispute.id,
    jobId: dispute.jobId,
    jobTitle: job?.title ?? "Unknown job",
    clientId: dispute.clientId,
    clientName: client?.fullName ?? "Unknown client",
    freelancerId: dispute.freelancerId,
    freelancerName: freelancer?.fullName ?? "Unknown freelancer",
    status: dispute.status,
    openedAt: dispute.openedAt,
    summary: dispute.summary,
    transaction: dispute.transaction,
    ruling: dispute.ruling,
    refundTriggered: dispute.refundTriggered
  };
}

export async function getAdminMetrics() {
  const marketplaceUsers = users.filter((user) => user.role !== "admin");
  const activeJobs = jobs.filter((job) => ["open", "in_progress"].includes(job.status)).length;
  const openDisputes = disputes.filter((dispute) => dispute.status === "open").length;
  const flaggedListings = jobs.filter((job) => job.moderationStatus === "flagged").length;
  const revenueCurrentPeriod = payments.reduce((total, payment) => total + payment.amount, 0);
  const trustScoreDistribution = [
    { label: "0-49", count: marketplaceUsers.filter((user) => user.trustScore < 50).length },
    {
      label: "50-79",
      count: marketplaceUsers.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length
    },
    { label: "80-100", count: marketplaceUsers.filter((user) => user.trustScore >= 80).length }
  ];

  return {
    totalUsers: marketplaceUsers.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod,
    trustScoreDistribution
  };
}

export async function listAdminUsers(query = {}) {
  const role = normalizeRole(query.role);
  const status = normalizeStatus(query.status);
  const filtered = users
    .filter((user) => user.role !== "admin")
    .filter((user) => !role || user.role === role)
    .filter((user) => !status || user.status === status)
    .filter((user) => userMatchesSearch(user, query.search))
    .filter((user) => isOnOrAfter(user.joinedAt, query.joinedFrom))
    .filter((user) => isOnOrBefore(user.joinedAt, query.joinedTo))
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    .map(serializeUser);

  return paginate(filtered, query);
}

export async function getAdminUserDetail(id) {
  const user = findUser(id);
  const activeJobs = jobs
    .filter((job) => job.status === "open")
    .filter((job) => job.clientId === id || job.freelancerId === id)
    .map(serializeListing);
  const disputeHistory = disputes
    .filter((dispute) => dispute.clientId === id || dispute.freelancerId === id)
    .map(serializeDispute);

  return {
    profile: serializeUser(user),
    activeJobs,
    disputeHistory
  };
}

export async function updateUserStatus(id, payload = {}, adminUser) {
  const status = normalizeStatus(payload.status);
  if (!["active", "suspended", "banned"].includes(status)) {
    throw createServiceError(400, "Status must be active, suspended, or banned");
  }

  const user = findUser(id);
  if (user.role === "admin") {
    throw createServiceError(400, "Admin accounts cannot be changed from this panel");
  }

  const previousStatus = user.status;
  user.status = status;

  const audit = appendAuditLog({
    adminUser,
    actionType: "user_status",
    targetType: "user",
    targetId: user.id,
    summary: `${user.fullName} changed from ${previousStatus} to ${status}`,
    metadata: {
      previousStatus,
      newStatus: status,
      reason: payload.reason ?? ""
    }
  });

  return { user: serializeUser(user), audit };
}

export async function listModerationQueue(query = {}) {
  const moderationStatus = query.status ? String(query.status).toLowerCase() : undefined;
  const filtered = jobs
    .filter((job) => job.moderationStatus)
    .filter((job) => !moderationStatus || job.moderationStatus === moderationStatus)
    .sort((a, b) => new Date(b.flaggedAt ?? b.createdAt) - new Date(a.flaggedAt ?? a.createdAt))
    .map(serializeListing);

  return paginate(filtered, query);
}

export async function moderateListing(id, payload = {}, adminUser) {
  const decision = String(payload.decision ?? "").toLowerCase();
  if (!["approve", "reject", "escalate"].includes(decision)) {
    throw createServiceError(400, "Decision must be approve, reject, or escalate");
  }

  const listing = findJob(id);
  const previousStatus = listing.moderationStatus ?? "approved";
  const nextStatus = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "escalated";
  listing.moderationStatus = nextStatus;
  listing.moderationReason = payload.reason ?? "";
  listing.moderatedAt = new Date().toISOString();

  const audit = appendAuditLog({
    adminUser,
    actionType: "listing_moderation",
    targetType: "job",
    targetId: listing.id,
    summary: `${listing.title} moderation changed from ${previousStatus} to ${nextStatus}`,
    metadata: {
      previousStatus,
      decision,
      reason: payload.reason ?? ""
    }
  });

  const notification =
    decision === "reject"
      ? appendNotification({
          userId: listing.clientId,
          title: "Listing rejected",
          body: `Your listing \"${listing.title}\" was rejected: ${payload.reason ?? "No reason supplied."}`,
          metadata: { listingId: listing.id }
        })
      : null;

  return { listing: serializeListing(listing), notification, audit };
}

export async function listDisputes(query = {}) {
  const status = query.status ? String(query.status).toLowerCase() : undefined;
  const filtered = disputes
    .filter((dispute) => !status || dispute.status === status)
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
    .map(serializeDispute);

  return paginate(filtered, query);
}

export async function getDisputeDetail(id) {
  const dispute = findDispute(id);
  return {
    ...serializeDispute(dispute),
    thread: dispute.thread,
    evidence: dispute.evidence,
    transaction: dispute.transaction
  };
}

export async function ruleDispute(id, payload = {}, adminUser) {
  const ruling = String(payload.ruling ?? "").toLowerCase();
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw createServiceError(400, "Ruling must be client, freelancer, or escalate");
  }

  const dispute = findDispute(id);
  const previousStatus = dispute.status;
  dispute.ruling = ruling;
  dispute.status = ruling === "escalate" ? "escalated" : "resolved";
  dispute.refundTriggered = Boolean(payload.refund);
  dispute.resolutionNotes = payload.notes ?? "";
  dispute.resolvedAt = new Date().toISOString();

  const notificationsForParties =
    ruling === "escalate"
      ? []
      : [dispute.clientId, dispute.freelancerId].map((userId) =>
          appendNotification({
            userId,
            title: "Dispute ruling issued",
            body: `Dispute ${dispute.id} was resolved in favour of the ${ruling}.`,
            metadata: {
              disputeId: dispute.id,
              refundTriggered: dispute.refundTriggered
            }
          })
        );

  const audit = appendAuditLog({
    adminUser,
    actionType: "dispute_ruling",
    targetType: "dispute",
    targetId: dispute.id,
    summary: `Dispute ${dispute.id} moved from ${previousStatus} to ${dispute.status}`,
    metadata: {
      ruling,
      refundTriggered: dispute.refundTriggered,
      notes: payload.notes ?? ""
    }
  });

  return {
    dispute: {
      ...serializeDispute(dispute),
      transaction: dispute.transaction
    },
    notifications: notificationsForParties,
    audit
  };
}

export async function getPlatformControls() {
  return Object.fromEntries(
    Object.entries(platformControls).map(([key, control]) => [key, { ...control }])
  );
}

export async function updatePlatformControl(key, payload = {}, adminUser) {
  const control = platformControls[key];
  if (!control) {
    throw createServiceError(404, "Platform control not found");
  }

  if (payload.confirm !== true) {
    throw createServiceError(400, "Explicit confirmation is required before changing a platform control");
  }

  if (typeof payload.enabled !== "boolean") {
    throw createServiceError(400, "Enabled must be a boolean value");
  }

  const previousValue = control.enabled;
  control.enabled = payload.enabled;
  control.updatedAt = new Date().toISOString();
  control.updatedBy = getAdminId(adminUser);

  const audit = appendAuditLog({
    adminUser,
    actionType: "control_update",
    targetType: "platform_control",
    targetId: control.key,
    summary: `${control.label} changed from ${previousValue} to ${control.enabled}`,
    metadata: {
      previousValue,
      newValue: control.enabled
    }
  });

  return { control: { ...control }, audit };
}

export async function listAuditLogs(query = {}) {
  const actionType = query.actionType ? String(query.actionType) : undefined;
  const adminId = query.admin ? String(query.admin) : undefined;
  const filtered = auditLogs
    .filter((entry) => !actionType || entry.actionType === actionType)
    .filter((entry) => !adminId || entry.adminId === adminId)
    .filter((entry) => isOnOrAfter(entry.createdAt, query.from))
    .filter((entry) => isOnOrBefore(entry.createdAt, query.to));

  return paginate(filtered, query);
}
