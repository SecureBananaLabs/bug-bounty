const users = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-14",
    activeJobs: 4,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_1002",
    name: "Northwind Labs",
    email: "ops@northwind.test",
    role: "client",
    status: "under_review",
    joinedAt: "2026-02-02",
    activeJobs: 7,
    disputes: 2,
    trustScore: 61
  },
  {
    id: "usr_1003",
    name: "Jordan Patel",
    email: "jordan@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-01-22",
    activeJobs: 1,
    disputes: 1,
    trustScore: 42
  }
];

const flaggedListings = [
  {
    id: "flag_2001",
    jobId: "job_778",
    title: "Scrape private marketplace data",
    postedBy: "Northwind Labs",
    reason: "Automated policy flagged possible ToS violation",
    severity: "high",
    status: "pending"
  },
  {
    id: "flag_2002",
    jobId: "job_804",
    title: "Build a product onboarding flow",
    postedBy: "Atlas Apps",
    reason: "User report: unclear payment terms",
    severity: "medium",
    status: "pending"
  }
];

const disputes = [
  {
    id: "dsp_3001",
    status: "open",
    client: "Northwind Labs",
    freelancer: "Maya Chen",
    amount: 2400,
    transactionId: "txn_9fd82",
    evidence: ["delivery.zip", "scope-change.pdf"],
    thread: [
      "Client says the milestone is incomplete.",
      "Freelancer provided commit links and staging URL."
    ],
    ruling: null
  },
  {
    id: "dsp_3002",
    status: "under_review",
    client: "BrightDesk",
    freelancer: "Jordan Patel",
    amount: 850,
    transactionId: "txn_3ac19",
    evidence: ["invoice.pdf"],
    thread: ["Payment release was paused after a refund request."],
    ruling: null
  }
];

const controls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "system",
    action: "admin.panel.seeded",
    target: "dashboard",
    createdAt: "2026-05-17T00:00:00.000Z",
    details: "Initial admin dashboard data loaded"
  }
];

function addAudit(adminId, action, target, details) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    action,
    target,
    createdAt: new Date().toISOString(),
    details
  };
  auditLog.unshift(entry);
  return entry;
}

function matches(value, expected) {
  return !expected || String(value).toLowerCase() === String(expected).toLowerCase();
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status === "pending").length,
    revenueCurrentPeriod: 128900
  };
}

export async function getDashboardOverview() {
  const metrics = await getAdminMetrics();
  return {
    metrics,
    controls,
    trustDistribution: [
      { band: "90-100", count: users.filter((user) => user.trustScore >= 90).length },
      { band: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { band: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
      { band: "0-49", count: users.filter((user) => user.trustScore < 50).length }
    ],
    recentAudit: auditLog.slice(0, 5)
  };
}

export async function getUsers(filters = {}) {
  const search = String(filters.search ?? "").toLowerCase();
  return users.filter((user) => {
    const text = `${user.name} ${user.email}`.toLowerCase();
    return (
      matches(user.role, filters.role) &&
      matches(user.status, filters.status) &&
      (!search || text.includes(search))
    );
  });
}

export async function updateUserStatus(id, status, adminId) {
  const allowedStatuses = new Set(["active", "suspended", "banned", "under_review"]);
  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((item) => item.id === id);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  addAudit(adminId, "user.status.updated", id, `Set user status to ${status}`);
  return user;
}

export async function getModerationQueue(filters = {}) {
  return flaggedListings.filter((listing) => matches(listing.status, filters.status));
}

export async function moderateFlaggedListing(id, action, reason, adminId) {
  const allowedActions = new Set(["approved", "rejected", "escalated"]);
  if (!allowedActions.has(action)) {
    throw new Error("Unsupported moderation action");
  }

  const listing = flaggedListings.find((item) => item.id === id);
  if (!listing) {
    throw new Error("Flagged listing not found");
  }

  listing.status = action;
  listing.resolutionReason = reason ?? "";
  addAudit(adminId, `listing.${action}`, id, reason ?? `Listing ${action}`);
  return listing;
}

export async function getDisputes(filters = {}) {
  return disputes.filter((dispute) => matches(dispute.status, filters.status));
}

export async function updateDisputeRuling(id, outcome, note, adminId) {
  const allowedOutcomes = new Set(["client", "freelancer", "escalated"]);
  if (!allowedOutcomes.has(outcome)) {
    throw new Error("Unsupported dispute ruling");
  }

  const dispute = disputes.find((item) => item.id === id);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  dispute.status = outcome === "escalated" ? "under_review" : "resolved";
  dispute.ruling = { outcome, note: note ?? "", ruledAt: new Date().toISOString() };
  addAudit(adminId, "dispute.ruled", id, `Outcome: ${outcome}`);
  return dispute;
}

export async function getControls() {
  return controls;
}

export async function updateControl(key, enabled, adminId) {
  if (!(key in controls)) {
    throw new Error("Unknown platform control");
  }

  controls[key] = enabled;
  addAudit(adminId, "platform.control.updated", key, `Set ${key} to ${enabled}`);
  return { key, enabled };
}

export async function getAuditLog(filters = {}) {
  return auditLog.filter((entry) => matches(entry.action, filters.action));
}
