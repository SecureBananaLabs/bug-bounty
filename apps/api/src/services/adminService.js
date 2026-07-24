const users = [
  {
    id: "usr_001",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-02",
    activeJobs: 3,
    disputes: 1,
    trustScore: 88
  },
  {
    id: "usr_002",
    name: "Morgan Builder",
    email: "morgan@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-14",
    activeJobs: 5,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_003",
    name: "Riley Review",
    email: "riley@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-12-08",
    activeJobs: 1,
    disputes: 2,
    trustScore: 51
  }
];

const flaggedListings = [
  {
    id: "job_flag_001",
    title: "Scrape private marketplace listings",
    reporter: "automated-risk-rules",
    ownerId: "usr_001",
    reason: "Potential platform bypass language",
    status: "flagged"
  },
  {
    id: "job_flag_002",
    title: "Build analytics dashboard",
    reporter: "usr_002",
    ownerId: "usr_003",
    reason: "Payment terms unclear",
    status: "under_review"
  }
];

const disputes = [
  {
    id: "dsp_001",
    jobId: "job_441",
    clientId: "usr_001",
    freelancerId: "usr_002",
    status: "open",
    amountUsd: 1200,
    evidenceCount: 4,
    transaction: { paymentId: "pay_441", escrowStatus: "held", refundableAmountUsd: 1200 },
    evidence: [
      { id: "ev_001", type: "message", label: "Missed milestone report" },
      { id: "ev_002", type: "upload", label: "Delivery archive" }
    ],
    thread: ["Client reports missed milestone.", "Freelancer uploaded delivery evidence."]
  },
  {
    id: "dsp_002",
    jobId: "job_502",
    clientId: "usr_003",
    freelancerId: "usr_002",
    status: "under_review",
    amountUsd: 640,
    evidenceCount: 2,
    transaction: { paymentId: "pay_502", escrowStatus: "review", refundableAmountUsd: 640 },
    evidence: [
      { id: "ev_003", type: "screenshot", label: "Scope comparison screenshot" }
    ],
    thread: ["Scope dispute opened.", "Senior admin requested screenshots."]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "aud_001",
    adminId: "usr_admin",
    action: "listing.escalated",
    targetId: "job_flag_002",
    createdAt: "2026-05-19T17:30:00.000Z",
    details: "Escalated for senior review"
  }
];

function paginate(items, { page = 1, pageSize = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    items: items.slice(start, start + safePageSize)
  };
}

function recordAudit(adminId, action, targetId, details) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    action,
    targetId,
    createdAt: new Date().toISOString(),
    details
  };
  auditLog.unshift(entry);
  return entry;
}

export async function getAdminOverview() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedCount = flaggedListings.filter((listing) => listing.status !== "approved").length;
  return {
    metrics: {
      totalUsers: users.length,
      activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
      openDisputes,
      flaggedListings: flaggedCount,
      revenueCurrentPeriod: 128900
    },
    trustDistribution: [
      { label: "0-59", count: users.filter((user) => user.trustScore < 60).length },
      { label: "60-79", count: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length },
      { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ],
    platformControls
  };
}

export async function listAdminUsers(filters = {}) {
  const query = String(filters.search ?? "").toLowerCase();
  const role = String(filters.role ?? "");
  const status = String(filters.status ?? "");
  const joinedFrom = filters.joinedFrom ? new Date(String(filters.joinedFrom)) : null;
  const joinedTo = filters.joinedTo ? new Date(String(filters.joinedTo)) : null;
  const filtered = users.filter((user) => {
    const joinedAt = new Date(user.joinedAt);
    const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    const matchesJoinedFrom = !joinedFrom || joinedAt >= joinedFrom;
    const matchesJoinedTo = !joinedTo || joinedAt <= joinedTo;
    return matchesSearch && matchesRole && matchesStatus && matchesJoinedFrom && matchesJoinedTo;
  });
  return paginate(filtered, filters);
}

export async function updateUserStatus(userId, status, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Unsupported user status");
  }
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  user.status = status;
  const audit = recordAudit(adminId, `user.${status}`, userId, `User status changed to ${status}`);
  return { user, audit };
}

export async function listFlaggedListings(filters = {}) {
  const status = String(filters.status ?? "");
  const filtered = flaggedListings.filter((listing) => !status || listing.status === status);
  return paginate(filtered, filters);
}

export async function moderateListing(listingId, action, reason, adminId) {
  const nextStatuses = { approve: "approved", reject: "rejected", escalate: "escalated" };
  const listing = flaggedListings.find((item) => item.id === listingId);
  if (!listing || !nextStatuses[action]) {
    throw new Error("Invalid moderation action");
  }
  listing.status = nextStatuses[action];
  const audit = recordAudit(adminId, `listing.${listing.status}`, listingId, reason || "Moderation action applied");
  const notification = {
    userId: listing.ownerId,
    reason: reason || `Listing ${listing.status}`,
    sent: listing.status === "rejected"
  };
  return {
    listing,
    notification,
    audit
  };
}

export async function listDisputes(filters = {}) {
  const status = String(filters.status ?? "");
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);
  return paginate(filtered, filters);
}

export async function resolveDispute(disputeId, ruling, adminId) {
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw new Error("Invalid dispute ruling");
  }
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  const audit = recordAudit(adminId, `dispute.${ruling}`, disputeId, `Ruling: ${ruling}`);
  return {
    dispute,
    refund: ruling === "client"
      ? { paymentId: dispute.transaction.paymentId, amountUsd: dispute.transaction.refundableAmountUsd }
      : null,
    notifications: [dispute.clientId, dispute.freelancerId],
    audit
  };
}

export async function updatePlatformControl(control, enabled, adminId) {
  if (!(control in platformControls)) {
    throw new Error("Unknown platform control");
  }
  platformControls[control] = Boolean(enabled);
  const audit = recordAudit(adminId, `control.${control}`, control, `Set to ${Boolean(enabled)}`);
  return { platformControls, audit };
}

export async function listAuditLog(filters = {}) {
  const adminId = String(filters.adminId ?? "");
  const action = String(filters.action ?? "");
  const from = filters.from ? new Date(String(filters.from)) : null;
  const to = filters.to ? new Date(String(filters.to)) : null;
  const filtered = auditLog.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    const matchesAdmin = !adminId || entry.adminId === adminId;
    const matchesAction = !action || entry.action.startsWith(action);
    const matchesFrom = !from || createdAt >= from;
    const matchesTo = !to || createdAt <= to;
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });
  return paginate(filtered, filters);
}
