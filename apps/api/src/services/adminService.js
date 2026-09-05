const users = [
  {
    id: "usr_client_01",
    name: "Mira Holt",
    email: "mira@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-12",
    activeJobs: 3,
    disputes: 1,
    trustScore: 88
  },
  {
    id: "usr_freelancer_01",
    name: "Jon Reyes",
    email: "jon@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-28",
    activeJobs: 2,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_client_02",
    name: "North Pier Studio",
    email: "ops@northpier.example",
    role: "client",
    status: "suspended",
    joinedAt: "2026-02-18",
    activeJobs: 0,
    disputes: 2,
    trustScore: 42
  },
  {
    id: "usr_freelancer_02",
    name: "Aya Khan",
    email: "aya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-02",
    activeJobs: 1,
    disputes: 0,
    trustScore: 76
  }
];

const flaggedListings = [
  {
    id: "job_flagged_01",
    title: "Urgent wallet recovery automation",
    clientId: "usr_client_02",
    status: "flagged",
    reason: "Automated scam-pattern rule matched off-platform payment wording.",
    reportedAt: "2026-05-14T18:20:00.000Z",
    risk: "high"
  },
  {
    id: "job_flagged_02",
    title: "Marketplace scraper prototype",
    clientId: "usr_client_01",
    status: "under_review",
    reason: "User report says listing may violate data access policy.",
    reportedAt: "2026-05-15T09:10:00.000Z",
    risk: "medium"
  }
];

const disputes = [
  {
    id: "dsp_1001",
    jobId: "job_api_migration",
    clientId: "usr_client_01",
    freelancerId: "usr_freelancer_01",
    status: "open",
    amount: 1800,
    thread: [
      "Client says staging API was not documented.",
      "Freelancer attached deployment logs and handoff notes."
    ],
    evidence: ["staging-build-log.txt", "handoff-notes.pdf"]
  },
  {
    id: "dsp_1002",
    jobId: "job_brand_system",
    clientId: "usr_client_02",
    freelancerId: "usr_freelancer_02",
    status: "under_review",
    amount: 950,
    thread: [
      "Freelancer requested milestone release after partial delivery.",
      "Client asked for refund due missed assets."
    ],
    evidence: ["milestone-chat.txt", "asset-checklist.csv"]
  }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-12T16:00:00.000Z",
    updatedBy: "system"
  },
  jobPosting: {
    key: "jobPosting",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-12T16:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLog = [
  {
    id: "aud_1001",
    adminId: "system",
    action: "platform.seeded",
    targetId: "admin-panel",
    detail: "Initial admin dataset loaded.",
    createdAt: "2026-05-12T16:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { range: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ]
  };
}

export async function listUsers({ page = 1, pageSize = 10, search = "", role, status, joinedAfter, joinedBefore }) {
  const filtered = users.filter((user) => {
    const matchesSearch = [user.name, user.email, user.id].some((value) =>
      value.toLowerCase().includes(search.toLowerCase())
    );
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    const joinedAt = new Date(user.joinedAt);
    const after = !joinedAfter || joinedAt >= new Date(joinedAfter);
    const before = !joinedBefore || joinedAt <= new Date(joinedBefore);
    return matchesSearch && matchesRole && matchesStatus && after && before;
  });

  return paginate(filtered, page, pageSize);
}

export async function setUserStatus({ userId, status, adminId }) {
  const allowedStatuses = new Set(["active", "suspended", "banned"]);
  if (!allowedStatuses.has(status)) {
    throw new AdminInputError("Unsupported user status");
  }

  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    throw new AdminInputError("User not found", 404);
  }

  user.status = status;
  appendAudit(adminId, `user.${status}`, userId, `User ${user.email} marked ${status}.`);
  return user;
}

export async function listFlaggedListings({ page = 1, pageSize = 10, status }) {
  const filtered = flaggedListings.filter((listing) => !status || listing.status === status);
  return paginate(filtered, page, pageSize);
}

export async function decideListing({ listingId, decision, reason, adminId }) {
  const allowedDecisions = new Set(["approved", "rejected", "escalated"]);
  if (!allowedDecisions.has(decision)) {
    throw new AdminInputError("Unsupported moderation decision");
  }

  const listing = flaggedListings.find((entry) => entry.id === listingId);
  if (!listing) {
    throw new AdminInputError("Listing not found", 404);
  }

  listing.status = decision;
  listing.resolutionReason = reason;
  listing.resolvedAt = new Date().toISOString();
  appendAudit(adminId, `listing.${decision}`, listingId, reason || `Listing ${decision}.`);

  return {
    listing,
    notification: {
      userId: listing.clientId,
      message: `Your listing \"${listing.title}\" was ${decision}.${reason ? ` Reason: ${reason}` : ""}`
    }
  };
}

export async function listDisputes({ page = 1, pageSize = 10, status }) {
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);
  return paginate(filtered, page, pageSize);
}

export async function ruleOnDispute({ disputeId, ruling, reason, adminId }) {
  const allowedRulings = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!allowedRulings.has(ruling)) {
    throw new AdminInputError("Unsupported dispute ruling");
  }

  const dispute = disputes.find((entry) => entry.id === disputeId);
  if (!dispute) {
    throw new AdminInputError("Dispute not found", 404);
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionReason = reason;
  dispute.resolvedAt = new Date().toISOString();
  appendAudit(adminId, `dispute.${ruling}`, disputeId, reason || `Dispute ruling: ${ruling}.`);

  return {
    dispute,
    notifications: [
      { userId: dispute.clientId, message: `Dispute ${dispute.id} ruling: ${ruling}` },
      { userId: dispute.freelancerId, message: `Dispute ${dispute.id} ruling: ${ruling}` }
    ]
  };
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function setPlatformControl({ key, enabled, adminId }) {
  const control = platformControls[key];
  if (!control) {
    throw new AdminInputError("Platform control not found", 404);
  }

  control.enabled = Boolean(enabled);
  control.updatedAt = new Date().toISOString();
  control.updatedBy = adminId;
  appendAudit(adminId, `control.${key}`, key, `${control.label} set to ${control.enabled ? "enabled" : "disabled"}.`);
  return control;
}

export async function listAuditLog({ page = 1, pageSize = 10, adminId, action, from, to }) {
  const filtered = auditLog.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return (!adminId || entry.adminId === adminId)
      && (!action || entry.action.includes(action))
      && (!from || createdAt >= new Date(from))
      && (!to || createdAt <= new Date(to));
  });

  return paginate([...filtered].reverse(), page, pageSize);
}

export class AdminInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function paginate(items, page, pageSize) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / safePageSize), 1)
  };
}

function appendAudit(adminId, action, targetId, detail) {
  auditLog.push({
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    action,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  });
}
