const users = [
  {
    id: "usr_001",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01",
    trustScore: 92,
    activeJobs: ["job_001", "job_003"],
    disputeHistory: ["dsp_001"]
  },
  {
    id: "usr_002",
    name: "Morgan Freelancer",
    email: "morgan@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-04",
    trustScore: 84,
    activeJobs: ["job_002"],
    disputeHistory: []
  },
  {
    id: "usr_003",
    name: "Casey Review",
    email: "casey@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-12",
    trustScore: 46,
    activeJobs: [],
    disputeHistory: ["dsp_001", "dsp_002"]
  }
];

const flaggedJobs = [
  {
    id: "job_001",
    title: "Build checkout flow",
    clientId: "usr_001",
    status: "flagged",
    reason: "Payment terms mention off-platform settlement",
    severity: "high",
    reportedAt: "2026-06-05T11:30:00.000Z"
  },
  {
    id: "job_004",
    title: "Scrape competitor leads",
    clientId: "usr_001",
    status: "escalated",
    reason: "Potential policy violation",
    severity: "medium",
    reportedAt: "2026-06-06T09:20:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_001",
    jobId: "job_001",
    clientId: "usr_001",
    freelancerId: "usr_003",
    status: "open",
    amount: 850,
    thread: [
      "Client says milestone was incomplete.",
      "Freelancer uploaded deployment evidence.",
      "Escrow hold is active pending admin ruling."
    ],
    evidence: ["deployment-log.txt", "milestone-brief.pdf"]
  },
  {
    id: "dsp_002",
    jobId: "job_002",
    clientId: "usr_001",
    freelancerId: "usr_002",
    status: "under_review",
    amount: 320,
    thread: ["Scope expansion disputed after final handoff."],
    evidence: ["handoff-screenshot.png"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "aud_001",
    adminId: "system",
    action: "admin_panel_seeded",
    targetType: "platform",
    targetId: "platform",
    details: "Initial admin queue snapshot loaded",
    createdAt: "2026-06-01T00:00:00.000Z"
  }
];

function paginate(items, page = 1, pageSize = 20) {
  const currentPage = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const start = (currentPage - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: currentPage,
    pageSize: size,
    total: items.length
  };
}

function writeAudit(adminId, action, targetType, targetId, details) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
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

function requireKnownUser(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

function requireKnownJob(jobId) {
  const job = flaggedJobs.find((item) => item.id === jobId);
  if (!job) {
    throw new Error("Flagged job not found");
  }
  return job;
}

function requireKnownDispute(disputeId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  return dispute;
}

export async function getAdminMetrics() {
  const activeJobs = users.reduce((count, user) => count + user.activeJobs.length, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = flaggedJobs.filter((job) => job.status !== "approved").length;
  const trustBands = users.reduce(
    (bands, user) => {
      if (user.trustScore >= 80) bands.high += 1;
      else if (user.trustScore >= 60) bands.medium += 1;
      else bands.low += 1;
      return bands;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: trustBands,
    controls: platformControls
  };
}

export async function listAdminUsers(filters = {}) {
  const { role, status, search, joinedAfter, joinedBefore, page, pageSize } = filters;
  let result = [...users];
  if (role) result = result.filter((user) => user.role === role);
  if (status) result = result.filter((user) => user.status === status);
  if (joinedAfter) result = result.filter((user) => user.joinedAt >= joinedAfter);
  if (joinedBefore) result = result.filter((user) => user.joinedAt <= joinedBefore);
  if (search) {
    const needle = search.toLowerCase();
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle)
    );
  }
  return paginate(result, page, pageSize);
}

export async function updateUserStatus(adminId, userId, status) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Invalid user status");
  }
  const user = requireKnownUser(userId);
  user.status = status;
  const audit = writeAudit(adminId, `user_${status}`, "user", userId, `User status set to ${status}`);
  return { user, audit };
}

export async function listFlaggedJobs(filters = {}) {
  const { status, severity, page, pageSize } = filters;
  let result = [...flaggedJobs];
  if (status) result = result.filter((job) => job.status === status);
  if (severity) result = result.filter((job) => job.severity === severity);
  return paginate(result, page, pageSize);
}

export async function moderateJob(adminId, jobId, action, reason = "") {
  if (!["approve", "reject", "escalate"].includes(action)) {
    throw new Error("Invalid moderation action");
  }
  const job = requireKnownJob(jobId);
  job.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  job.notification = action === "reject" ? `Listing rejected: ${reason || "Policy review"}` : null;
  const audit = writeAudit(adminId, `listing_${action}`, "job", jobId, reason || "No reason provided");
  return { job, audit };
}

export async function listDisputes(filters = {}) {
  const { status, page, pageSize } = filters;
  let result = [...disputes];
  if (status) result = result.filter((dispute) => dispute.status === status);
  return paginate(result, page, pageSize);
}

export async function ruleDispute(adminId, disputeId, ruling, note = "") {
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw new Error("Invalid dispute ruling");
  }
  const dispute = requireKnownDispute(disputeId);
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.notification = `Dispute ${dispute.id} updated: ${ruling}`;
  const audit = writeAudit(adminId, "dispute_ruling", "dispute", disputeId, note || ruling);
  return { dispute, audit };
}

export async function updatePlatformControl(adminId, key, enabled) {
  if (!["registrationsEnabled", "jobPostingEnabled"].includes(key)) {
    throw new Error("Invalid platform control");
  }
  platformControls[key] = Boolean(enabled);
  const audit = writeAudit(
    adminId,
    "platform_control_updated",
    "platform",
    key,
    `${key} set to ${platformControls[key]}`
  );
  return { controls: platformControls, audit };
}

export async function listAuditLog(filters = {}) {
  const { adminId, action, from, to, page, pageSize } = filters;
  let result = [...auditLog];
  if (adminId) result = result.filter((entry) => entry.adminId === adminId);
  if (action) result = result.filter((entry) => entry.action === action);
  if (from) result = result.filter((entry) => entry.createdAt >= from);
  if (to) result = result.filter((entry) => entry.createdAt <= to);
  return paginate(result, page, pageSize);
}
