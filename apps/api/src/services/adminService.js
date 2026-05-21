const users = [
  {
    id: "usr_101",
    name: "Maya Chen",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-12",
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_102",
    name: "Jordan Lee",
    role: "client",
    status: "active",
    joinedAt: "2026-04-28",
    activeJobs: 5,
    disputes: 1
  },
  {
    id: "usr_103",
    name: "Noor Patel",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-02",
    activeJobs: 1,
    disputes: 2
  },
  {
    id: "usr_104",
    name: "Elena Park",
    role: "client",
    status: "banned",
    joinedAt: "2026-03-21",
    activeJobs: 0,
    disputes: 3
  }
];

const flaggedListings = [
  {
    id: "flag_201",
    jobId: "job_201",
    title: "Scrape private marketplace data",
    reporter: "automated-rule",
    status: "pending",
    reason: "Possible policy violation"
  },
  {
    id: "flag_202",
    jobId: "job_202",
    title: "Build secure checkout audit",
    reporter: "usr_102",
    status: "escalated",
    reason: "Scope dispute"
  }
];

const disputes = [
  {
    id: "dsp_301",
    jobId: "job_155",
    freelancer: "usr_101",
    client: "usr_102",
    status: "open",
    amount: 90000,
    evidence: ["milestone chat", "delivery zip", "revision request"],
    thread: ["Client requested refund", "Freelancer submitted proof of delivery"]
  },
  {
    id: "dsp_302",
    jobId: "job_166",
    freelancer: "usr_103",
    client: "usr_104",
    status: "under_review",
    amount: 250000,
    evidence: ["invoice", "test report"],
    thread: ["Admin requested more evidence"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "audit_001",
    adminId: "seed-admin",
    action: "panel_seeded",
    targetId: "system",
    createdAt: "2026-05-21T00:00:00.000Z",
    details: "Initial admin demo data loaded"
  }
];

function now() {
  return new Date().toISOString();
}

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: items.length,
    items: items.slice(start, start + pageSize)
  };
}

function recordAudit(adminId, action, targetId, details = "") {
  const entry = {
    id: `audit_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    action,
    targetId,
    createdAt: now(),
    details
  };
  auditLog.unshift(entry);
  return entry;
}

export async function getAdminOverview() {
  return {
    metrics: await getAdminMetrics(),
    platformControls,
    trustDistribution: [
      { range: "0-20", count: 2 },
      { range: "21-40", count: 4 },
      { range: "41-60", count: 9 },
      { range: "61-80", count: 27 },
      { range: "81-100", count: 41 }
    ],
    recentAudit: auditLog.slice(0, 5)
  };
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status !== "approved").length,
    revenueCurrentPeriod: 128900
  };
}

export async function listUsers(query) {
  const search = String(query.search ?? "").toLowerCase();
  const role = query.role;
  const status = query.status;
  const filtered = users.filter((user) => {
    return (
      (!search || user.name.toLowerCase().includes(search) || user.id.includes(search)) &&
      (!role || user.role === role) &&
      (!status || user.status === status)
    );
  });
  return paginate(filtered, query);
}

export async function updateUserStatus(adminId, userId, status) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("status must be active, suspended, or banned");
  }

  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("user not found");
  }

  user.status = status;
  const audit = recordAudit(adminId, `user_${status}`, userId, `User status changed to ${status}`);
  return { user, audit };
}

export async function listModerationQueue(query) {
  const status = query.status;
  const filtered = flaggedListings.filter((listing) => !status || listing.status === status);
  return paginate(filtered, query);
}

export async function decideListing(adminId, listingId, decision, reason = "") {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw new Error("decision must be approved, rejected, or escalated");
  }

  const listing = flaggedListings.find((item) => item.id === listingId);
  if (!listing) {
    throw new Error("listing not found");
  }

  listing.status = decision;
  listing.reason = reason || listing.reason;
  const audit = recordAudit(adminId, `listing_${decision}`, listingId, reason);
  return {
    listing,
    notification: {
      recipient: listing.jobId,
      message: `Listing ${decision}: ${listing.reason}`
    },
    audit
  };
}

export async function listDisputes(query) {
  const status = query.status;
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);
  return paginate(filtered, query);
}

export async function ruleDispute(adminId, disputeId, ruling) {
  if (!["freelancer", "client", "escalate"].includes(ruling)) {
    throw new Error("ruling must be freelancer, client, or escalate");
  }

  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error("dispute not found");
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  const audit = recordAudit(adminId, `dispute_${ruling}`, disputeId, `Ruling: ${ruling}`);
  return {
    dispute,
    refundQueued: ruling === "client",
    notifications: [dispute.freelancer, dispute.client],
    audit
  };
}

export async function updatePlatformControl(adminId, key, enabled) {
  if (!["registrationsEnabled", "jobPostingEnabled"].includes(key)) {
    throw new Error("unknown platform control");
  }

  platformControls[key] = Boolean(enabled);
  const audit = recordAudit(adminId, `control_${key}`, key, `Set to ${platformControls[key]}`);
  return { platformControls, audit };
}

export async function listAuditLog(query) {
  const admin = query.admin;
  const action = query.action;
  const filtered = auditLog.filter((entry) => {
    return (!admin || entry.adminId === admin) && (!action || entry.action === action);
  });
  return paginate(filtered, query);
}
