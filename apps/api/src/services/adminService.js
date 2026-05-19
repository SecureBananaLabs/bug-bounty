const users = [
  {
    id: "usr_admin_1",
    name: "Nora Admin",
    email: "nora.admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-08T10:30:00.000Z",
    trustScore: 99,
    activeJobs: ["job_1001"],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    name: "Avery Client",
    email: "avery.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-14T12:00:00.000Z",
    trustScore: 88,
    activeJobs: ["job_1001", "job_flagged_1"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Mika Freelancer",
    email: "mika.freelancer@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-03T09:15:00.000Z",
    trustScore: 76,
    activeJobs: ["job_1001"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_2",
    name: "Devon Data",
    email: "devon.data@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-28T18:45:00.000Z",
    trustScore: 42,
    activeJobs: [],
    disputeHistory: []
  },
  {
    id: "usr_client_2",
    name: "Rowan Studio",
    email: "rowan.studio@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-16T08:05:00.000Z",
    trustScore: 91,
    activeJobs: ["job_flagged_2"],
    disputeHistory: []
  }
];

const flaggedJobs = [
  {
    id: "job_flagged_1",
    title: "Clone a payment gateway dashboard",
    clientId: "usr_client_1",
    status: "flagged",
    reason: "Automated rule detected restricted payment language",
    reportCount: 3,
    budget: 2400,
    updatedAt: "2026-05-17T11:25:00.000Z",
    notificationStatus: "pending"
  },
  {
    id: "job_flagged_2",
    title: "Scrape private lead databases",
    clientId: "usr_client_2",
    status: "flagged",
    reason: "Community reports mention private data collection",
    reportCount: 5,
    budget: 1800,
    updatedAt: "2026-05-18T15:10:00.000Z",
    notificationStatus: "pending"
  }
];

const disputes = [
  {
    id: "dsp_1",
    jobId: "job_1001",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 950,
    thread: [
      "Client says the final handoff missed the reporting export.",
      "Freelancer says the export was explicitly out of scope.",
      "Escrow payment is currently held for admin ruling."
    ],
    evidence: ["scope.pdf", "handoff.zip", "messages-export.json"],
    transaction: { escrowId: "esc_7821", currency: "usd", heldAmount: 950 },
    updatedAt: "2026-05-18T19:35:00.000Z"
  },
  {
    id: "dsp_2",
    jobId: "job_1040",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    status: "under_review",
    amount: 420,
    thread: [
      "Client requested a refund after milestone one.",
      "Freelancer uploaded partial source files and time logs."
    ],
    evidence: ["time-log.csv", "milestone-1.zip"],
    transaction: { escrowId: "esc_8004", currency: "usd", heldAmount: 420 },
    updatedAt: "2026-05-18T21:50:00.000Z"
  }
];

const platformControls = {
  registrationsEnabled: {
    enabled: true,
    label: "New user registrations",
    updatedAt: "2026-05-18T10:00:00.000Z",
    updatedBy: "system"
  },
  jobPostingEnabled: {
    enabled: true,
    label: "New job postings",
    updatedAt: "2026-05-18T10:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLog = [
  {
    id: "aud_seed_1",
    adminId: "system",
    action: "platform.seeded",
    targetType: "system",
    targetId: "admin-panel",
    details: "Initial admin review dataset loaded",
    createdAt: "2026-05-18T10:00:00.000Z"
  }
];

const validUserStatuses = new Set(["active", "suspended", "banned"]);
const validModerationActions = new Set(["approve", "reject", "escalate"]);
const validRulings = new Set(["client", "freelancer", "split", "escalate"]);

function nowIso() {
  return new Date().toISOString();
}

function adminIdFrom(reqUser) {
  return reqUser?.sub ?? "admin";
}

function clampPageSize(value) {
  const parsed = Number(value ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), 50);
}

function toPage(value) {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(parsed, 1);
}

function paginate(items, query) {
  const page = toPage(query.page);
  const pageSize = clampPageSize(query.pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize
  };
}

function matchesSearch(user, search) {
  if (!search) return true;
  const normalized = search.toLowerCase();
  return [user.name, user.email, user.id].some((value) =>
    value.toLowerCase().includes(normalized)
  );
}

function pushAudit(adminId, action, targetType, targetId, details) {
  const event = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: nowIso()
  };
  auditLog.unshift(event);
  return event;
}

function userSummary(user) {
  return {
    ...user,
    activeJobCount: user.activeJobs.length,
    disputeCount: user.disputeHistory.length
  };
}

export async function getAdminMetrics() {
  const activeUsers = users.filter((user) => user.status === "active").length;
  const activeJobs = users.reduce((sum, user) => sum + user.activeJobs.length, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = flaggedJobs.filter((job) => job.status === "flagged").length;
  const revenue = [...flaggedJobs, ...disputes].reduce((sum, item) => {
    return sum + (item.budget ?? item.amount ?? 0);
  }, 0);
  const trustScoreDistribution = [
    { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    {
      range: "50-79",
      count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length
    },
    { range: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
  ];

  return {
    totalUsers: users.length,
    activeUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: revenue,
    trustScoreDistribution,
    refreshedAt: nowIso()
  };
}

export async function listAdminUsers(query = {}) {
  const filtered = users
    .filter((user) => matchesSearch(user, query.search))
    .filter((user) => (!query.role ? true : user.role === query.role))
    .filter((user) => (!query.status ? true : user.status === query.status))
    .filter((user) => (!query.joinedAfter ? true : user.joinedAt >= query.joinedAfter))
    .filter((user) => (!query.joinedBefore ? true : user.joinedAt <= query.joinedBefore))
    .map(userSummary);

  return paginate(filtered, query);
}

export async function getAdminUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  return {
    ...userSummary(user),
    activeJobs: flaggedJobs.filter((job) => user.activeJobs.includes(job.id)),
    disputes: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function updateUserStatus(userId, status, reqUser) {
  if (!validUserStatuses.has(status)) {
    return { error: "Invalid user status" };
  }

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return { error: "User not found", statusCode: 404 };
  }

  const previousStatus = user.status;
  user.status = status;
  pushAudit(
    adminIdFrom(reqUser),
    "user.status_updated",
    "user",
    user.id,
    `${previousStatus} -> ${status}`
  );

  return { user: userSummary(user) };
}

export async function listModerationJobs(query = {}) {
  const filtered = flaggedJobs.filter((job) => (!query.status ? true : job.status === query.status));
  return paginate(filtered, query);
}

export async function moderateJob(jobId, payload, reqUser) {
  const action = payload?.action;
  if (!validModerationActions.has(action)) {
    return { error: "Invalid moderation action" };
  }
  if (action === "reject" && !payload.reason) {
    return { error: "Rejection reason is required" };
  }

  const job = flaggedJobs.find((candidate) => candidate.id === jobId);
  if (!job) {
    return { error: "Flagged job not found", statusCode: 404 };
  }

  const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  job.status = nextStatus;
  job.updatedAt = nowIso();
  job.notificationStatus = action === "reject" ? "sent" : "not_required";
  job.resolutionReason = payload.reason ?? null;

  pushAudit(
    adminIdFrom(reqUser),
    `job.${nextStatus}`,
    "job",
    job.id,
    payload.reason ?? `Moderation action: ${action}`
  );

  return { job };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => (!query.status ? true : dispute.status === query.status));
  return paginate(filtered, query);
}

export async function ruleOnDispute(disputeId, payload, reqUser) {
  const ruling = payload?.ruling;
  if (!validRulings.has(ruling)) {
    return { error: "Invalid dispute ruling" };
  }

  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    return { error: "Dispute not found", statusCode: 404 };
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.refundPercent = Number(payload.refundPercent ?? 0);
  dispute.updatedAt = nowIso();
  dispute.notificationStatus = "sent";

  pushAudit(
    adminIdFrom(reqUser),
    "dispute.ruling_recorded",
    "dispute",
    dispute.id,
    `Ruling: ${ruling}; refundPercent: ${dispute.refundPercent}`
  );

  return { dispute };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(controlName, payload, reqUser) {
  const control = platformControls[controlName];
  if (!control) {
    return { error: "Platform control not found", statusCode: 404 };
  }
  if (typeof payload?.enabled !== "boolean") {
    return { error: "enabled must be a boolean" };
  }

  const previous = control.enabled;
  control.enabled = payload.enabled;
  control.updatedAt = nowIso();
  control.updatedBy = adminIdFrom(reqUser);

  pushAudit(
    adminIdFrom(reqUser),
    "platform.control_updated",
    "platformControl",
    controlName,
    `${previous} -> ${payload.enabled}`
  );

  return { [controlName]: control };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog
    .filter((event) => (!query.adminId ? true : event.adminId === query.adminId))
    .filter((event) => (!query.action ? true : event.action === query.action));
  return paginate(filtered, query);
}
