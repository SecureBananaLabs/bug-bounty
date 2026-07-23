const users = [
  {
    id: "usr_001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinDate: "2026-01-12",
    trustScore: 94,
    activeJobs: ["job_101"],
    disputeHistory: []
  },
  {
    id: "usr_002",
    name: "Orion Labs",
    email: "ops@orion.example",
    role: "client",
    status: "active",
    joinDate: "2026-02-03",
    trustScore: 71,
    activeJobs: ["job_102", "job_103"],
    disputeHistory: ["dsp_001"]
  },
  {
    id: "usr_003",
    name: "Nora Security",
    email: "nora@example.com",
    role: "freelancer",
    status: "under_review",
    joinDate: "2026-03-18",
    trustScore: 48,
    activeJobs: [],
    disputeHistory: ["dsp_002"]
  },
  {
    id: "usr_004",
    name: "Cedar Ventures",
    email: "work@cedar.example",
    role: "client",
    status: "suspended",
    joinDate: "2025-12-22",
    trustScore: 38,
    activeJobs: ["job_104"],
    disputeHistory: ["dsp_002"]
  },
  {
    id: "usr_005",
    name: "Iris UX",
    email: "iris@example.com",
    role: "freelancer",
    status: "active",
    joinDate: "2026-04-05",
    trustScore: 86,
    activeJobs: ["job_105"],
    disputeHistory: []
  }
];

const moderationQueue = [
  {
    id: "job_flag_001",
    jobId: "job_104",
    title: "Scrape protected customer portals",
    posterId: "usr_004",
    reason: "Automated policy scanner detected credential harvesting language",
    status: "flagged",
    reportedBy: "rule:credential-safety",
    createdAt: "2026-06-02T09:30:00Z"
  },
  {
    id: "job_flag_002",
    jobId: "job_106",
    title: "AI onboarding flow copy review",
    posterId: "usr_002",
    reason: "User report: duplicate listing",
    status: "under_review",
    reportedBy: "usr_001",
    createdAt: "2026-06-04T14:15:00Z"
  }
];

const disputes = [
  {
    id: "dsp_001",
    clientId: "usr_002",
    freelancerId: "usr_001",
    jobId: "job_102",
    amount: 1800,
    status: "open",
    thread: [
      "Client says milestone was incomplete.",
      "Freelancer attached delivery logs and staging link."
    ],
    evidence: ["staging-url", "delivery-log"],
    ruling: null
  },
  {
    id: "dsp_002",
    clientId: "usr_004",
    freelancerId: "usr_003",
    jobId: "job_104",
    amount: 640,
    status: "under_review",
    thread: ["Both parties submitted screenshots."],
    evidence: ["chat-export", "invoice"],
    ruling: null
  }
];

const platformControls = {
  newRegistrations: {
    key: "newRegistrations",
    label: "New user registrations",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-06-01T00:00:00Z"
  },
  newJobPostings: {
    key: "newJobPostings",
    label: "New job postings",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-06-01T00:00:00Z"
  }
};

const notifications = [];

const auditLogs = [
  {
    id: "audit_001",
    adminId: "system",
    actionType: "admin.panel.seeded",
    targetType: "admin_panel",
    targetId: "initial_state",
    metadata: { source: "adminService" },
    createdAt: "2026-06-01T00:00:00Z"
  }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs.length, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((listing) => listing.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { bucket: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { bucket: "50-74", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 75).length },
      { bucket: "75-100", count: users.filter((user) => user.trustScore >= 75).length }
    ],
    controls: Object.values(platformControls),
    refreshedAt: new Date().toISOString()
  };
}

export async function listUsers(query = {}) {
  const filtered = users.filter((user) => {
    const search = normalize(query.search);
    const matchesSearch =
      !search ||
      [user.name, user.email, user.role, user.status].some((value) =>
        normalize(value).includes(search)
      );
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesJoinedAfter = !query.joinedAfter || user.joinDate >= query.joinedAfter;
    const matchesJoinedBefore = !query.joinedBefore || user.joinDate <= query.joinedBefore;

    return matchesSearch && matchesRole && matchesStatus && matchesJoinedAfter && matchesJoinedBefore;
  });

  return paginate(filtered, query);
}

export async function getUserDetail(userId) {
  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  return {
    ...user,
    activeJobs: user.activeJobs.map((jobId) => ({ id: jobId, title: jobTitle(jobId) })),
    disputeHistory: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function updateUserStatus(userId, payload = {}, admin) {
  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  const validStatuses = new Set(["active", "suspended", "banned", "under_review"]);
  if (!validStatuses.has(payload.status)) {
    return { error: "status must be active, suspended, banned, or under_review" };
  }

  user.status = payload.status;
  const audit = recordAudit(admin, "admin.user.status_changed", "user", user.id, {
    status: payload.status,
    reason: payload.reason ?? "No reason supplied"
  });

  return { user, audit };
}

export async function listModerationQueue(query = {}) {
  const filtered = moderationQueue.filter((listing) => !query.status || listing.status === query.status);
  return paginate(filtered, query);
}

export async function updateListingDecision(listingId, payload = {}, admin) {
  const listing = moderationQueue.find((entry) => entry.id === listingId);
  if (!listing) {
    return null;
  }

  const decisionToStatus = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const status = decisionToStatus[payload.decision];
  if (!status) {
    return { error: "decision must be approve, reject, or escalate" };
  }

  listing.status = status;
  listing.decisionReason = payload.reason ?? "No reason supplied";

  if (payload.decision === "reject") {
    notifications.push({
      id: `ntf_${Date.now()}`,
      userId: listing.posterId,
      type: "listing_rejected",
      message: listing.decisionReason
    });
  }

  const audit = recordAudit(admin, `admin.listing.${payload.decision}`, "listing", listing.id, {
    reason: listing.decisionReason,
    jobId: listing.jobId
  });

  return { listing, audit };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function updateDisputeRuling(disputeId, payload = {}, admin) {
  const dispute = disputes.find((entry) => entry.id === disputeId);
  if (!dispute) {
    return null;
  }

  const validRulings = new Set(["favor_client", "favor_freelancer", "refund", "escalate"]);
  if (!validRulings.has(payload.ruling)) {
    return { error: "ruling must be favor_client, favor_freelancer, refund, or escalate" };
  }

  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = {
    outcome: payload.ruling,
    reason: payload.reason ?? "No reason supplied",
    decidedAt: new Date().toISOString(),
    decidedBy: admin.sub
  };

  notifications.push(
    {
      id: `ntf_${Date.now()}_client`,
      userId: dispute.clientId,
      type: "dispute_ruling",
      message: dispute.ruling.reason
    },
    {
      id: `ntf_${Date.now()}_freelancer`,
      userId: dispute.freelancerId,
      type: "dispute_ruling",
      message: dispute.ruling.reason
    }
  );

  const audit = recordAudit(admin, "admin.dispute.ruling", "dispute", dispute.id, dispute.ruling);
  return { dispute, audit };
}

export async function listPlatformControls() {
  return Object.values(platformControls);
}

export async function updatePlatformControl(controlKey, payload = {}, admin) {
  const control = platformControls[controlKey];
  if (!control) {
    return null;
  }

  if (typeof payload.enabled !== "boolean") {
    return { error: "enabled must be a boolean" };
  }

  control.enabled = payload.enabled;
  control.updatedBy = admin.sub;
  control.updatedAt = new Date().toISOString();

  const audit = recordAudit(admin, "admin.control.updated", "platform_control", control.key, {
    enabled: control.enabled,
    reason: payload.reason ?? "No reason supplied"
  });

  return { control, audit };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLogs.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.actionType || entry.actionType === query.actionType;
    const matchesTarget = !query.targetId || entry.targetId === query.targetId;
    const matchesFrom = !query.from || entry.createdAt >= query.from;
    const matchesTo = !query.to || entry.createdAt <= query.to;
    return matchesAdmin && matchesAction && matchesTarget && matchesFrom && matchesTo;
  });

  return paginate(filtered.toReversed(), query);
}

function recordAudit(admin, actionType, targetType, targetId, metadata = {}) {
  const audit = {
    id: `audit_${String(auditLogs.length + 1).padStart(3, "0")}`,
    adminId: admin.sub,
    actionType,
    targetType,
    targetId,
    metadata,
    createdAt: new Date().toISOString()
  };

  auditLogs.push(audit);
  return audit;
}

function paginate(items, query) {
  const page = positiveInteger(query.page, 1);
  const pageSize = Math.min(positiveInteger(query.pageSize, 10), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function jobTitle(jobId) {
  const titles = {
    job_101: "AI support widget",
    job_102: "Legacy API migration",
    job_103: "SaaS onboarding flows",
    job_104: "Protected portal scraping",
    job_105: "Marketplace UX audit"
  };

  return titles[jobId] ?? "Unknown job";
}
