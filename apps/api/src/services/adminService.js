const now = new Date("2026-05-22T00:00:00.000Z");

const users = [
  {
    id: "usr_client_001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-09",
    activeJobs: 3,
    disputeCount: 1,
    trustScore: 91
  },
  {
    id: "usr_free_002",
    name: "Arun Patel",
    email: "arun@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14",
    activeJobs: 2,
    disputeCount: 0,
    trustScore: 84
  },
  {
    id: "usr_free_003",
    name: "Lena Ortiz",
    email: "lena@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-12-03",
    activeJobs: 0,
    disputeCount: 2,
    trustScore: 48
  },
  {
    id: "usr_client_004",
    name: "Northstar Labs",
    email: "ops@northstar.example",
    role: "client",
    status: "review",
    joinedAt: "2026-03-22",
    activeJobs: 1,
    disputeCount: 1,
    trustScore: 63
  }
];

const flaggedListings = [
  {
    id: "flag_1001",
    jobId: "job_9001",
    title: "Wallet recovery automation",
    reporter: "automated-risk-rules",
    ownerId: "usr_client_004",
    reason: "Escrow bypass language detected",
    severity: "high",
    status: "pending"
  },
  {
    id: "flag_1002",
    jobId: "job_9007",
    title: "Data enrichment script",
    reporter: "usr_free_002",
    ownerId: "usr_client_001",
    reason: "Unclear data provenance",
    severity: "medium",
    status: "escalated"
  }
];

const disputes = [
  {
    id: "dsp_7001",
    jobId: "job_9003",
    clientId: "usr_client_001",
    freelancerId: "usr_free_003",
    amount: 2400,
    status: "open",
    openedAt: "2026-05-18",
    summary: "Client disputes delivery after milestone approval.",
    evidence: ["milestone-chat.txt", "delivery.zip"],
    thread: [
      "Client: deliverable did not match scope.",
      "Freelancer: requested changes were outside the signed brief."
    ]
  },
  {
    id: "dsp_7002",
    jobId: "job_9012",
    clientId: "usr_client_004",
    freelancerId: "usr_free_002",
    amount: 950,
    status: "under_review",
    openedAt: "2026-05-20",
    summary: "Escrow release blocked after policy review.",
    evidence: ["invoice.pdf", "scope-change.md"],
    thread: ["System: payment hold triggered.", "Admin: awaiting client evidence."]
  }
];

const platformControls = {
  maintenanceMode: false,
  allowNewJobs: true,
  autoModeration: true,
  disputeEscalationLimit: 72
};

const auditLog = [
  {
    id: "aud_001",
    actorId: "system",
    action: "admin_panel_seeded",
    target: "platform",
    createdAt: now.toISOString()
  }
];

function actor(req) {
  return req.user?.sub ?? "admin";
}

function writeAudit(action, target, req, details = {}) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    actorId: actor(req),
    action,
    target,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function matches(value, expected) {
  return !expected || String(value).toLowerCase() === String(expected).toLowerCase();
}

function contains(value, query) {
  return !query || String(value).toLowerCase().includes(String(query).toLowerCase());
}

export async function getAdminMetrics() {
  const activeUsers = users.filter((user) => user.status === "active").length;
  const flaggedPending = flaggedListings.filter((listing) => listing.status !== "approved").length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const trustBuckets = {
    high: users.filter((user) => user.trustScore >= 80).length,
    medium: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length,
    low: users.filter((user) => user.trustScore < 60).length
  };

  return {
    totalUsers: users.length,
    activeUsers,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes,
    flaggedListings: flaggedPending,
    revenueCurrentPeriod: 128900,
    trustBuckets,
    platformControls
  };
}

export async function listAdminUsers(filters = {}) {
  return users.filter((user) => {
    return (
      matches(user.role, filters.role) &&
      matches(user.status, filters.status) &&
      contains(`${user.name} ${user.email}`, filters.search)
    );
  });
}

export async function updateUserStatus(userId, status, req) {
  if (!["active", "suspended", "banned", "review"].includes(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  writeAudit("user_status_updated", userId, req, { status });
  return user;
}

export async function listFlaggedListings(filters = {}) {
  return flaggedListings.filter((listing) => {
    return matches(listing.status, filters.status) && matches(listing.severity, filters.severity);
  });
}

export async function moderateListing(flagId, action, reason, req) {
  if (!["approve", "reject", "escalate"].includes(action)) {
    throw new Error("Unsupported moderation action");
  }

  const listing = flaggedListings.find((item) => item.id === flagId);
  if (!listing) {
    throw new Error("Flagged listing not found");
  }

  listing.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  listing.resolutionReason = reason ?? null;
  listing.notification = action === "reject" ? `Posting user notified: ${reason ?? "listing rejected"}` : null;
  writeAudit("listing_moderated", flagId, req, { action, reason });
  return listing;
}

export async function listDisputes(filters = {}) {
  return disputes.filter((dispute) => matches(dispute.status, filters.status));
}

export async function resolveDispute(disputeId, ruling, note, req) {
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionNote = note ?? null;
  dispute.notifications = ["client_notified", "freelancer_notified"];
  writeAudit("dispute_ruled", disputeId, req, { ruling, note });
  return dispute;
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControls(nextControls, req) {
  Object.assign(platformControls, {
    maintenanceMode: nextControls.maintenanceMode ?? platformControls.maintenanceMode,
    allowNewJobs: nextControls.allowNewJobs ?? platformControls.allowNewJobs,
    autoModeration: nextControls.autoModeration ?? platformControls.autoModeration,
    disputeEscalationLimit: nextControls.disputeEscalationLimit ?? platformControls.disputeEscalationLimit
  });
  writeAudit("platform_controls_updated", "platform", req, nextControls);
  return platformControls;
}

export async function listAuditLog() {
  return auditLog;
}
