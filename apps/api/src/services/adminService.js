const users = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12",
    activeJobs: 3,
    disputes: 0,
    trustScore: 94
  },
  {
    id: "usr_1002",
    name: "Orion Labs",
    email: "ops@orion.example",
    role: "client",
    status: "under_review",
    joinedAt: "2026-02-03",
    activeJobs: 8,
    disputes: 2,
    trustScore: 61
  },
  {
    id: "usr_1003",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-11-19",
    activeJobs: 0,
    disputes: 3,
    trustScore: 38
  },
  {
    id: "usr_1004",
    name: "Northstar Studio",
    email: "hello@northstar.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-28",
    activeJobs: 5,
    disputes: 0,
    trustScore: 88
  },
  {
    id: "usr_1005",
    name: "Lena Ortiz",
    email: "lena@example.com",
    role: "freelancer",
    status: "banned",
    joinedAt: "2025-09-07",
    activeJobs: 0,
    disputes: 5,
    trustScore: 21
  }
];

const flaggedListings = [
  {
    id: "job_2001",
    title: "Scrape private marketplace profiles",
    client: "Orion Labs",
    status: "flagged",
    reason: "Possible privacy violation",
    reports: 4,
    createdAt: "2026-05-14"
  },
  {
    id: "job_2002",
    title: "Emergency Next.js checkout fix",
    client: "Northstar Studio",
    status: "flagged",
    reason: "Suspicious payment wording",
    reports: 2,
    createdAt: "2026-05-16"
  },
  {
    id: "job_2003",
    title: "Design portfolio refresh",
    client: "Arcadia Collective",
    status: "escalated",
    reason: "Repeated duplicate listing reports",
    reports: 6,
    createdAt: "2026-05-17"
  }
];

const disputes = [
  {
    id: "disp_3001",
    jobTitle: "API migration sprint",
    client: "Orion Labs",
    freelancer: "Maya Chen",
    status: "open",
    amount: 2800,
    reason: "Milestone delivery disagreement",
    thread: [
      "Client says the staging deployment was incomplete.",
      "Freelancer attached test evidence for delivered endpoints."
    ],
    evidence: ["staging-log.txt", "contract-scope.pdf"]
  },
  {
    id: "disp_3002",
    jobTitle: "Landing page design",
    client: "Northstar Studio",
    freelancer: "Jon Bell",
    status: "under_review",
    amount: 900,
    reason: "Final files missing editable sources",
    thread: [
      "Client requested editable assets.",
      "Freelancer says editable sources were outside original scope."
    ],
    evidence: ["handoff.zip", "message-thread.csv"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "audit_1",
    adminId: "admin_seed",
    action: "review_listing",
    targetType: "listing",
    targetId: "job_2003",
    createdAt: "2026-05-18T09:30:00.000Z",
    details: "Escalated duplicate listing reports"
  }
];

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate(items, query = {}) {
  const page = toPositiveInteger(query.page, 1);
  const pageSize = Math.min(toPositiveInteger(query.pageSize, 10), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize))
  };
}

function addAuditEntry(adminId, action, targetType, targetId, details) {
  const entry = {
    id: `audit_${auditLog.length + 1}`,
    adminId,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
    details
  };

  auditLog.unshift(entry);
  return entry;
}

export async function getAdminMetrics() {
  const activeJobs = users.reduce((total, user) => total + user.activeJobs, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListingsCount = flaggedListings.filter((listing) => listing.status === "flagged").length;

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings: flaggedListingsCount,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length },
      { label: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { label: "0-49", count: users.filter((user) => user.trustScore < 50).length }
    ],
    refreshedAt: new Date().toISOString()
  };
}

export async function listUsers(query) {
  const search = query.search?.toLowerCase() ?? "";
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const joinedAfter = !query.joinedAfter || user.joinedAt >= query.joinedAfter;
    const joinedBefore = !query.joinedBefore || user.joinedAt <= query.joinedBefore;

    return matchesSearch && matchesRole && matchesStatus && joinedAfter && joinedBefore;
  });

  return paginate(filtered, query);
}

export async function updateUserStatus(userId, status, adminId) {
  const allowedStatuses = new Set(["active", "under_review", "suspended", "banned"]);
  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  const audit = addAuditEntry(adminId, "update_user_status", "user", userId, `Set status to ${status}`);

  return { user, audit };
}

export async function listModerationQueue(query) {
  const status = query.status;
  const filtered = flaggedListings.filter((listing) => !status || listing.status === status);
  return paginate(filtered, query);
}

export async function decideListing(listingId, action, reason, adminId) {
  const nextStatusByAction = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = nextStatusByAction[action];
  if (!nextStatus) {
    throw new Error("Unsupported listing action");
  }

  const listing = flaggedListings.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  listing.status = nextStatus;
  listing.decisionReason = reason || "No reason provided";
  listing.notification = `Listing ${nextStatus}: ${listing.decisionReason}`;
  const audit = addAuditEntry(adminId, "moderate_listing", "listing", listingId, listing.notification);

  return { listing, audit };
}

export async function listDisputes(query) {
  const status = query.status;
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);
  return paginate(filtered, query);
}

export async function ruleOnDispute(disputeId, ruling, note, adminId) {
  const allowedRulings = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!allowedRulings.has(ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionNote = note || "No note provided";
  dispute.notifications = [
    `Client notified: dispute ${dispute.id} ${dispute.status}`,
    `Freelancer notified: dispute ${dispute.id} ${dispute.status}`
  ];

  const audit = addAuditEntry(
    adminId,
    "rule_dispute",
    "dispute",
    disputeId,
    `Ruling: ${ruling}. ${dispute.resolutionNote}`
  );

  return { dispute, audit };
}

export async function getPlatformControls() {
  return { ...platformControls };
}

export async function updatePlatformControls(payload, adminId) {
  const changes = [];

  for (const key of ["registrationsEnabled", "jobPostingEnabled"]) {
    if (typeof payload[key] === "boolean" && platformControls[key] !== payload[key]) {
      platformControls[key] = payload[key];
      changes.push(`${key}=${payload[key]}`);
    }
  }

  const audit = addAuditEntry(
    adminId,
    "update_platform_controls",
    "platform",
    "controls",
    changes.length ? changes.join(", ") : "No control changes"
  );

  return { controls: { ...platformControls }, audit };
}

export async function listAuditLog(query) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action === query.action;
    const matchesTarget = !query.targetType || entry.targetType === query.targetType;
    return matchesAdmin && matchesAction && matchesTarget;
  });

  return paginate(filtered, query);
}
