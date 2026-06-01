const users = [
  {
    id: "usr_client_1",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-12T09:20:00.000Z",
    trustScore: 86,
    activeJobs: ["job_101"],
    disputeHistory: ["dsp_1001"]
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Freelancer",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-03T14:10:00.000Z",
    trustScore: 94,
    activeJobs: ["job_102"],
    disputeHistory: []
  },
  {
    id: "usr_client_2",
    name: "Jordan Client",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-19T11:02:00.000Z",
    trustScore: 51,
    activeJobs: [],
    disputeHistory: ["dsp_1002"]
  },
  {
    id: "usr_freelancer_2",
    name: "Riley Freelancer",
    email: "riley@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-21T08:42:00.000Z",
    trustScore: 73,
    activeJobs: ["job_103"],
    disputeHistory: ["dsp_1002"]
  }
];

const jobs = [
  {
    id: "job_101",
    title: "Build AI customer support widget",
    clientId: "usr_client_1",
    status: "active",
    budget: 4200
  },
  {
    id: "job_102",
    title: "Migrate API to Node.js",
    clientId: "usr_client_1",
    status: "active",
    budget: 2800
  },
  {
    id: "job_103",
    title: "Design marketplace onboarding",
    clientId: "usr_client_2",
    status: "active",
    budget: 1900
  }
];

const flaggedListings = [
  {
    id: "flag_2001",
    jobId: "job_103",
    title: "Design marketplace onboarding",
    reporter: "automated-rules",
    reason: "Suspicious external payment request",
    status: "pending",
    createdAt: "2026-05-20T16:15:00.000Z",
    ownerId: "usr_client_2"
  },
  {
    id: "flag_2002",
    jobId: "job_101",
    title: "Build AI customer support widget",
    reporter: "usr_freelancer_1",
    reason: "Scope changed after proposal acceptance",
    status: "escalated",
    createdAt: "2026-05-22T10:45:00.000Z",
    ownerId: "usr_client_1"
  }
];

const disputes = [
  {
    id: "dsp_1001",
    jobId: "job_101",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    amount: 4200,
    status: "open",
    openedAt: "2026-05-18T13:30:00.000Z",
    thread: [
      { authorId: "usr_client_1", body: "Milestone output was incomplete.", createdAt: "2026-05-18T13:30:00.000Z" },
      { authorId: "usr_freelancer_1", body: "Requested assets were missing until after delivery.", createdAt: "2026-05-18T14:05:00.000Z" }
    ],
    evidence: [
      { id: "ev_1", type: "screenshot", label: "Milestone delivery screenshot" },
      { id: "ev_2", type: "contract", label: "Accepted proposal scope" }
    ]
  },
  {
    id: "dsp_1002",
    jobId: "job_103",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    amount: 1900,
    status: "under_review",
    openedAt: "2026-05-21T09:12:00.000Z",
    thread: [
      { authorId: "usr_freelancer_2", body: "Client requested off-platform settlement.", createdAt: "2026-05-21T09:12:00.000Z" }
    ],
    evidence: [
      { id: "ev_3", type: "message", label: "Off-platform payment request" }
    ]
  }
];

const notifications = [];

let platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
  updatedAt: "2026-05-20T12:00:00.000Z",
  updatedBy: "system"
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "system",
    actionType: "platform.seeded",
    targetType: "platform",
    targetId: "controls",
    message: "Initial admin panel seed data created",
    createdAt: "2026-05-20T12:00:00.000Z"
  }
];

function pageParams(query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = pageParams(query);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function appendAudit(adminId, actionType, targetType, targetId, message) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetType,
    targetId,
    message,
    createdAt: new Date().toISOString()
  };
  auditLog.push(entry);
  return entry;
}

function notify(userId, message, metadata = {}) {
  const notification = {
    id: `ntf_${notifications.length + 1}`,
    userId,
    message,
    metadata,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
}

function inDateRange(value, from, to) {
  const timestamp = Date.parse(value);
  if (from && timestamp < Date.parse(from)) {
    return false;
  }
  if (to && timestamp > Date.parse(to)) {
    return false;
  }
  return true;
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "active").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status !== "approved").length,
    revenueCurrentPeriod: jobs.reduce((total, job) => total + job.budget, 0),
    trustDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
      { range: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ],
    refreshedAt: new Date().toISOString()
  };
}

export async function listUsers(query = {}) {
  const search = String(query.search ?? "").toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch = !search || [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(search));
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesDate = inDateRange(user.joinedAt, query.joinedFrom, query.joinedTo);
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  return paginate(filtered, query);
}

export async function getUserDetail(id) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return null;
  }

  return {
    ...user,
    activeJobs: jobs.filter((job) => user.activeJobs.includes(job.id)),
    disputes: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function updateUserStatus(id, payload = {}, adminId) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return null;
  }

  const allowedStatuses = new Set(["active", "suspended", "banned"]);
  if (!allowedStatuses.has(payload.status)) {
    throw new Error("status must be active, suspended, or banned");
  }

  user.status = payload.status;
  appendAudit(adminId, `user.${payload.status}`, "user", user.id, payload.reason ?? `User set to ${payload.status}`);
  return user;
}

export async function getModerationQueue(query = {}) {
  const filtered = flaggedListings.filter((listing) => {
    const matchesStatus = !query.status || listing.status === query.status;
    return matchesStatus && inDateRange(listing.createdAt, query.from, query.to);
  });

  return paginate(filtered, query);
}

export async function recordListingDecision(id, payload = {}, adminId) {
  const listing = flaggedListings.find((candidate) => candidate.id === id);
  if (!listing) {
    return null;
  }

  const decisions = new Set(["approve", "reject", "escalate"]);
  if (!decisions.has(payload.decision)) {
    throw new Error("decision must be approve, reject, or escalate");
  }

  listing.status = payload.decision === "approve" ? "approved" : payload.decision === "reject" ? "rejected" : "escalated";
  listing.resolutionReason = payload.reason ?? "";
  listing.resolvedAt = new Date().toISOString();
  listing.resolvedBy = adminId;

  const audit = appendAudit(adminId, `listing.${listing.status}`, "flagged_listing", listing.id, payload.reason ?? `Listing ${listing.status}`);
  const notification = listing.status === "rejected"
    ? notify(listing.ownerId, `Your listing "${listing.title}" was rejected: ${listing.resolutionReason || "policy review"}`, { listingId: listing.id })
    : null;

  return { listing, audit, notification };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => {
    const matchesStatus = !query.status || dispute.status === query.status;
    return matchesStatus && inDateRange(dispute.openedAt, query.from, query.to);
  });

  return paginate(filtered, query);
}

export async function getDispute(id) {
  return disputes.find((dispute) => dispute.id === id) ?? null;
}

export async function recordDisputeRuling(id, payload = {}, adminId) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) {
    return null;
  }

  const rulings = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!rulings.has(payload.ruling)) {
    throw new Error("ruling must be client, freelancer, refund, or escalate");
  }

  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingReason = payload.reason ?? "";
  dispute.resolvedAt = dispute.status === "resolved" ? new Date().toISOString() : null;
  dispute.reviewedBy = adminId;

  const audit = appendAudit(adminId, `dispute.${payload.ruling}`, "dispute", dispute.id, payload.reason ?? `Dispute ruling: ${payload.ruling}`);
  const clientNotification = notify(dispute.clientId, `Dispute ${dispute.id} update: ${payload.ruling}`, { disputeId: dispute.id });
  const freelancerNotification = notify(dispute.freelancerId, `Dispute ${dispute.id} update: ${payload.ruling}`, { disputeId: dispute.id });

  return { dispute, audit, notifications: [clientNotification, freelancerNotification] };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControls(payload = {}, adminId) {
  const nextControls = { ...platformControls };

  if (typeof payload.registrationsEnabled === "boolean") {
    nextControls.registrationsEnabled = payload.registrationsEnabled;
  }
  if (typeof payload.jobPostingsEnabled === "boolean") {
    nextControls.jobPostingsEnabled = payload.jobPostingsEnabled;
  }

  nextControls.updatedAt = new Date().toISOString();
  nextControls.updatedBy = adminId;
  platformControls = nextControls;
  const audit = appendAudit(adminId, "platform.controls.updated", "platform", "controls", payload.reason ?? "Platform controls updated");

  return { controls: platformControls, audit };
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.actionType || entry.actionType === query.actionType;
    return matchesAdmin && matchesAction && inDateRange(entry.createdAt, query.from, query.to);
  });

  return paginate([...filtered].reverse(), query);
}
