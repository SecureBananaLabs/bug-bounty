class AdminServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
    this.expose = true;
  }
}

const users = [
  {
    id: "usr_client_1",
    name: "Mara Lewis",
    email: "mara@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-08T10:30:00.000Z",
    trustScore: 91,
    activeJobs: 4,
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Theo Nguyen",
    email: "theo@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14T14:20:00.000Z",
    trustScore: 84,
    activeJobs: 2,
    disputeHistory: ["dsp_1", "dsp_2"]
  },
  {
    id: "usr_client_2",
    name: "Northstar Labs",
    email: "ops@northstar.example",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-03T09:00:00.000Z",
    trustScore: 57,
    activeJobs: 1,
    disputeHistory: ["dsp_2"]
  },
  {
    id: "usr_freelancer_2",
    name: "Amara Patel",
    email: "amara@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-18T16:15:00.000Z",
    trustScore: 72,
    activeJobs: 3,
    disputeHistory: []
  }
];

const moderationQueue = [
  {
    id: "mod_1",
    jobId: "job_1",
    title: "Urgent payment processor clone",
    posterId: "usr_client_2",
    posterName: "Northstar Labs",
    status: "pending",
    reason: "Automated rules flagged payment credential language",
    reportedBy: "risk-engine",
    budget: 4200,
    createdAt: "2026-05-18T08:40:00.000Z",
    notifications: []
  },
  {
    id: "mod_2",
    jobId: "job_2",
    title: "Landing page copy refresh",
    posterId: "usr_client_1",
    posterName: "Mara Lewis",
    status: "pending",
    reason: "Multiple user reports for misleading scope",
    reportedBy: "usr_freelancer_1",
    budget: 850,
    createdAt: "2026-05-19T11:10:00.000Z",
    notifications: []
  }
];

const disputes = [
  {
    id: "dsp_1",
    jobTitle: "Checkout integration",
    clientId: "usr_client_1",
    clientName: "Mara Lewis",
    freelancerId: "usr_freelancer_1",
    freelancerName: "Theo Nguyen",
    status: "open",
    transactionId: "txn_1001",
    amount: 1800,
    openedAt: "2026-05-17T12:10:00.000Z",
    thread: [
      { from: "client", message: "Milestone was not delivered.", at: "2026-05-17T12:10:00.000Z" },
      { from: "freelancer", message: "Work was delivered in staging.", at: "2026-05-17T13:45:00.000Z" }
    ],
    evidence: ["staging-url.txt", "scope-change.pdf"],
    notifications: []
  },
  {
    id: "dsp_2",
    jobTitle: "Data import script",
    clientId: "usr_client_2",
    clientName: "Northstar Labs",
    freelancerId: "usr_freelancer_1",
    freelancerName: "Theo Nguyen",
    status: "under_review",
    transactionId: "txn_1002",
    amount: 950,
    openedAt: "2026-05-16T15:00:00.000Z",
    thread: [
      { from: "freelancer", message: "Client requested unpaid extra work.", at: "2026-05-16T15:00:00.000Z" }
    ],
    evidence: ["message-export.json"],
    notifications: []
  }
];

const platformSettings = {
  registrationsEnabled: true,
  jobPostingEnabled: true,
  updatedAt: "2026-05-20T00:00:00.000Z"
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin_seed",
    actionType: "settings.reviewed",
    targetId: "platform",
    details: "Initial admin panel seed review",
    createdAt: "2026-05-20T00:00:00.000Z"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAdminId(reqUser) {
  return reqUser?.sub ?? "usr_admin_unknown";
}

function addAuditEntry(adminId, actionType, targetId, details) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function parsePage(query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10) || 10, 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = parsePage(query);
  const start = (page - 1) * pageSize;

  return {
    items: clone(items.slice(start, start + pageSize)),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function isWithinDateRange(value, from, to) {
  const timestamp = new Date(value).getTime();
  if (from && timestamp < new Date(from).getTime()) {
    return false;
  }
  if (to && timestamp > new Date(to).getTime()) {
    return false;
  }
  return true;
}

function findUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new AdminServiceError("User not found", 404);
  }
  return user;
}

function buildTrustDistribution() {
  const buckets = [
    { label: "0-49", min: 0, max: 49 },
    { label: "50-69", min: 50, max: 69 },
    { label: "70-84", min: 70, max: 84 },
    { label: "85-100", min: 85, max: 100 }
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: users.filter((user) => user.trustScore >= bucket.min && user.trustScore <= bucket.max).length
  }));
}

export function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((listing) => listing.status === "pending").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: buildTrustDistribution(),
    refreshedAt: new Date().toISOString()
  };
}

export function listUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch = !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesJoinedAt = isWithinDateRange(user.joinedAt, query.joinedFrom, query.joinedTo);
    return matchesSearch && matchesRole && matchesStatus && matchesJoinedAt;
  });

  return paginate(filteredUsers, query);
}

export function getUserProfile(userId) {
  const user = findUser(userId);
  return clone({
    ...user,
    activeJobSummary: `${user.activeJobs} active jobs`,
    disputes: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  });
}

export function updateUserStatus(userId, payload, reqUser) {
  const allowedStatuses = new Set(["active", "suspended", "banned"]);
  const nextStatus = payload.status;
  if (!allowedStatuses.has(nextStatus)) {
    throw new AdminServiceError("status must be active, suspended, or banned");
  }

  const user = findUser(userId);
  user.status = nextStatus;
  user.statusReason = payload.reason ?? "";
  user.updatedAt = new Date().toISOString();
  addAuditEntry(getAdminId(reqUser), `user.${nextStatus}`, userId, user.statusReason || `Status changed to ${nextStatus}`);

  return clone(user);
}

export function listModerationQueue(query = {}) {
  const filteredListings = moderationQueue.filter((listing) => !query.status || listing.status === query.status);
  return paginate(filteredListings, query);
}

export function decideFlaggedListing(listingId, payload, reqUser) {
  const listing = moderationQueue.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw new AdminServiceError("Flagged listing not found", 404);
  }

  const decisions = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = decisions[payload.decision];
  if (!nextStatus) {
    throw new AdminServiceError("decision must be approve, reject, or escalate");
  }

  listing.status = nextStatus;
  listing.decisionReason = payload.reason ?? "";
  listing.reviewedAt = new Date().toISOString();

  if (payload.decision === "reject") {
    listing.notifications.push({
      userId: listing.posterId,
      message: payload.reason || "Your listing was rejected by moderation.",
      createdAt: new Date().toISOString()
    });
  }

  addAuditEntry(getAdminId(reqUser), `listing.${nextStatus}`, listingId, listing.decisionReason || nextStatus);
  return clone(listing);
}

export function listDisputes(query = {}) {
  const filteredDisputes = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filteredDisputes, query);
}

export function getDispute(disputeId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new AdminServiceError("Dispute not found", 404);
  }
  return clone(dispute);
}

export function ruleDispute(disputeId, payload, reqUser) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new AdminServiceError("Dispute not found", 404);
  }

  const allowedRulings = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!allowedRulings.has(payload.ruling)) {
    throw new AdminServiceError("ruling must be client, freelancer, refund, or escalate");
  }

  dispute.ruling = payload.ruling;
  dispute.rulingReason = payload.reason ?? "";
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.notifications.push({
    userIds: [dispute.clientId, dispute.freelancerId],
    message: payload.reason || `Dispute ruling: ${payload.ruling}`,
    createdAt: new Date().toISOString()
  });
  dispute.resolvedAt = new Date().toISOString();

  addAuditEntry(getAdminId(reqUser), `dispute.${payload.ruling}`, disputeId, dispute.rulingReason || dispute.status);
  return clone(dispute);
}

export function getPlatformSettings() {
  return clone(platformSettings);
}

export function updatePlatformSettings(payload, reqUser) {
  const adminId = getAdminId(reqUser);
  const changedSettings = [];

  for (const key of ["registrationsEnabled", "jobPostingEnabled"]) {
    if (payload[key] !== undefined) {
      if (typeof payload[key] !== "boolean") {
        throw new AdminServiceError(`${key} must be boolean`);
      }

      if (platformSettings[key] !== payload[key]) {
        platformSettings[key] = payload[key];
        changedSettings.push(key);
        addAuditEntry(adminId, `settings.${key}`, "platform", payload.reason ?? `${key} updated`);
      }
    }
  }

  if (changedSettings.length === 0) {
    throw new AdminServiceError("At least one platform setting must change");
  }

  platformSettings.updatedAt = new Date().toISOString();
  return clone({ ...platformSettings, changedSettings });
}

export function listAuditLog(query = {}) {
  const filteredAuditLog = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.actionType || entry.actionType === query.actionType;
    const matchesDate = isWithinDateRange(entry.createdAt, query.from, query.to);
    return matchesAdmin && matchesAction && matchesDate;
  });

  return paginate(filteredAuditLog, query);
}
