const now = "2026-05-18T03:00:00.000Z";

const users = [
  {
    id: "usr_client_001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-03T09:30:00.000Z",
    trustScore: 92,
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_free_002",
    name: "Jordan Vale",
    email: "jordan@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-12T14:10:00.000Z",
    trustScore: 81,
    activeJobs: 2,
    disputes: 1
  },
  {
    id: "usr_free_003",
    name: "Rina Patel",
    email: "rina@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-21T11:45:00.000Z",
    trustScore: 46,
    activeJobs: 0,
    disputes: 2
  },
  {
    id: "usr_client_004",
    name: "Northstar Labs",
    email: "ops@northstar.example",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01T08:15:00.000Z",
    trustScore: 74,
    activeJobs: 5,
    disputes: 1
  }
];

const flaggedListings = [
  {
    id: "flag_101",
    jobId: "job_101",
    title: "Scrape private customer records",
    reporter: "automated-policy",
    reason: "Potential privacy violation",
    status: "flagged",
    ownerId: "usr_client_004",
    createdAt: "2026-05-17T16:20:00.000Z"
  },
  {
    id: "flag_102",
    jobId: "job_102",
    title: "Rush payment gateway review",
    reporter: "usr_free_002",
    reason: "Scope changed after acceptance",
    status: "under_review",
    ownerId: "usr_client_001",
    createdAt: "2026-05-17T18:05:00.000Z"
  }
];

const disputes = [
  {
    id: "disp_201",
    clientId: "usr_client_004",
    freelancerId: "usr_free_002",
    jobId: "job_201",
    amount: 1800,
    status: "open",
    subject: "Milestone deliverable rejected after approval",
    thread: [
      "Client requested additional revisions after release.",
      "Freelancer uploaded evidence of prior approval."
    ],
    evidence: ["approval-message.png", "milestone-log.json"]
  },
  {
    id: "disp_202",
    clientId: "usr_client_001",
    freelancerId: "usr_free_003",
    jobId: "job_202",
    amount: 650,
    status: "under_review",
    subject: "Incomplete dashboard handoff",
    thread: ["Client reports missing source files."],
    evidence: ["handoff-checklist.md"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "audit_001",
    adminId: "system",
    action: "seeded_admin_state",
    targetType: "system",
    targetId: "admin-panel",
    details: "Initial admin demo state loaded",
    createdAt: now
  }
];

function paginate(items, query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? "10", 10), 1), 50);
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / limit), 1)
  };
}

function appendAudit(adminId, action, targetType, targetId, details) {
  const entry = {
    id: `audit_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

export async function getAdminMetrics() {
  const totalUsers = users.length;
  const activeJobs = users.reduce((sum, user) => sum + user.activeJobs, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedCount = flaggedListings.filter((listing) => listing.status !== "approved").length;

  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedListings: flaggedCount,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { range: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ]
  };
}

export async function listAdminUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesJoinDate = !query.joinedAfter || new Date(user.joinedAt) >= new Date(query.joinedAfter);
    return matchesSearch && matchesRole && matchesStatus && matchesJoinDate;
  });

  return paginate(filtered, query);
}

export async function updateUserStatus(userId, status, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("status must be active, suspended, or banned");
  }

  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  appendAudit(adminId, `user_${status}`, "user", userId, `User ${user.email} marked ${status}`);
  return user;
}

export async function listModerationQueue(query = {}) {
  const status = query.status;
  const filtered = status ? flaggedListings.filter((listing) => listing.status === status) : flaggedListings;
  return paginate(filtered, query);
}

export async function moderateListing(listingId, payload, adminId) {
  const listing = flaggedListings.find((item) => item.id === listingId);
  if (!listing) {
    throw new Error("Flagged listing not found");
  }

  if (!["approve", "reject", "escalate"].includes(payload.action)) {
    throw new Error("action must be approve, reject, or escalate");
  }

  listing.status = payload.action === "approve" ? "approved" : payload.action === "reject" ? "rejected" : "escalated";
  listing.resolutionReason = payload.reason ?? "";
  appendAudit(
    adminId,
    `listing_${listing.status}`,
    "job",
    listing.jobId,
    listing.resolutionReason || `Listing ${listing.status}`
  );

  return {
    listing,
    notification: {
      userId: listing.ownerId,
      message: `Your listing was ${listing.status}${listing.resolutionReason ? `: ${listing.resolutionReason}` : ""}`
    }
  };
}

export async function listDisputes(query = {}) {
  const status = query.status;
  const filtered = status ? disputes.filter((dispute) => dispute.status === status) : disputes;
  return paginate(filtered, query);
}

export async function ruleDispute(disputeId, payload, adminId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (!["client", "freelancer", "escalate"].includes(payload.ruling)) {
    throw new Error("ruling must be client, freelancer, or escalate");
  }

  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingReason = payload.reason ?? "";
  appendAudit(adminId, "dispute_ruling", "dispute", disputeId, `${payload.ruling}: ${dispute.rulingReason}`);

  return {
    dispute,
    notifications: [
      { userId: dispute.clientId, message: `Dispute ${dispute.id} updated: ${payload.ruling}` },
      { userId: dispute.freelancerId, message: `Dispute ${dispute.id} updated: ${payload.ruling}` }
    ]
  };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(control, enabled, adminId) {
  if (!Object.hasOwn(platformControls, control)) {
    throw new Error("Unknown platform control");
  }

  platformControls[control] = Boolean(enabled);
  appendAudit(adminId, "platform_control_updated", "platform_control", control, `${control} set to ${enabled}`);
  return platformControls;
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action === query.action;
    const matchesFrom = !query.from || new Date(entry.createdAt) >= new Date(query.from);
    const matchesTo = !query.to || new Date(entry.createdAt) <= new Date(query.to);
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}
