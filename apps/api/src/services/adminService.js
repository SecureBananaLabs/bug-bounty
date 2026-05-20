const users = [
  {
    id: "usr_101",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12",
    trustScore: 94,
    activeJobs: ["job_201"],
    disputes: ["disp_301"]
  },
  {
    id: "usr_102",
    name: "Northstar Studio",
    email: "ops@northstar.example",
    role: "client",
    status: "active",
    joinedAt: "2026-02-02",
    trustScore: 81,
    activeJobs: ["job_202", "job_203"],
    disputes: []
  },
  {
    id: "usr_103",
    name: "Ravi Patel",
    email: "ravi@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2025-12-18",
    trustScore: 52,
    activeJobs: [],
    disputes: ["disp_302"]
  },
  {
    id: "usr_104",
    name: "Atlas Retail",
    email: "finance@atlas.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-08",
    trustScore: 73,
    activeJobs: ["job_204"],
    disputes: []
  }
];

const jobs = [
  {
    id: "job_201",
    title: "Rebuild checkout analytics dashboard",
    clientId: "usr_102",
    freelancerId: "usr_101",
    status: "active",
    budget: 4200,
    flagged: true,
    flagReason: "External payment language detected",
    reports: 2,
    moderationStatus: "pending"
  },
  {
    id: "job_202",
    title: "Design onboarding screens",
    clientId: "usr_102",
    freelancerId: null,
    status: "active",
    budget: 1800,
    flagged: true,
    flagReason: "Unusually broad scope",
    reports: 1,
    moderationStatus: "pending"
  },
  {
    id: "job_203",
    title: "Migrate blog to Next.js",
    clientId: "usr_102",
    freelancerId: null,
    status: "active",
    budget: 2600,
    flagged: false,
    flagReason: null,
    reports: 0,
    moderationStatus: "approved"
  },
  {
    id: "job_204",
    title: "Build warehouse mobile workflow",
    clientId: "usr_104",
    freelancerId: null,
    status: "active",
    budget: 5200,
    flagged: true,
    flagReason: "Reported by freelancer",
    reports: 3,
    moderationStatus: "escalated"
  }
];

const disputes = [
  {
    id: "disp_301",
    jobId: "job_201",
    clientId: "usr_102",
    freelancerId: "usr_101",
    status: "open",
    amount: 1200,
    summary: "Milestone scope changed after delivery",
    thread: [
      "Freelancer submitted analytics dashboard v1.",
      "Client requested two extra integrations outside the milestone.",
      "Freelancer asked for a scope adjustment."
    ],
    evidence: ["contract-v3.pdf", "delivery-video.mp4"],
    transactionId: "pay_901"
  },
  {
    id: "disp_302",
    jobId: "job_204",
    clientId: "usr_104",
    freelancerId: "usr_103",
    status: "under_review",
    amount: 800,
    summary: "Client disputes incomplete mobile QA pass",
    thread: [
      "Client opened dispute after failed acceptance tests.",
      "Freelancer uploaded revised test evidence."
    ],
    evidence: ["qa-report.csv"],
    transactionId: "pay_902"
  }
];

const controls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "audit_100",
    adminId: "system",
    action: "seed",
    targetType: "platform",
    targetId: "initial-state",
    details: "Initial admin dashboard state",
    createdAt: "2026-05-20T00:00:00.000Z"
  }
];

const notifications = [];

function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / safePageSize), 1)
  };
}

function actorId(admin) {
  return admin?.sub ?? admin?.id ?? "unknown-admin";
}

function recordAudit(admin, action, targetType, targetId, details) {
  const entry = {
    id: `audit_${Date.now()}_${auditLog.length + 1}`,
    adminId: actorId(admin),
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function addNotification(userId, message) {
  notifications.unshift({
    id: `note_${Date.now()}_${notifications.length + 1}`,
    userId,
    message,
    createdAt: new Date().toISOString()
  });
}

function findUserOrThrow(id) {
  const user = users.find((item) => item.id === id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

function findJobOrThrow(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) {
    throw new Error("Job not found");
  }
  return job;
}

function findDisputeOrThrow(id) {
  const dispute = disputes.find((item) => item.id === id);
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  return dispute;
}

export async function getAdminOverview() {
  const flaggedListings = jobs.filter((job) => job.flagged && job.moderationStatus !== "approved");
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved");
  const revenue = jobs.reduce((sum, job) => sum + job.budget, 0);
  const trustDistribution = [
    { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { range: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
    { range: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];

  return {
    summary: {
      totalUsers: users.length,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      openDisputes: openDisputes.length,
      flaggedListings: flaggedListings.length,
      revenueCurrentPeriod: revenue
    },
    trustDistribution,
    controls,
    refreshedAt: new Date().toISOString()
  };
}

export async function listUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const role = query.role;
  const status = query.status;
  const joinedFrom = query.joinedFrom;
  const joinedTo = query.joinedTo;

  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);
    const matchesRole = !role || role === "all" || user.role === role;
    const matchesStatus = !status || status === "all" || user.status === status;
    const matchesJoinedFrom = !joinedFrom || user.joinedAt >= joinedFrom;
    const matchesJoinedTo = !joinedTo || user.joinedAt <= joinedTo;
    return matchesSearch && matchesRole && matchesStatus && matchesJoinedFrom && matchesJoinedTo;
  });

  return paginate(filtered, query);
}

export async function getUserProfile(userId) {
  const user = findUserOrThrow(userId);
  return {
    ...user,
    jobs: jobs.filter((job) => job.clientId === userId || job.freelancerId === userId),
    disputeHistory: disputes.filter(
      (dispute) => dispute.clientId === userId || dispute.freelancerId === userId
    )
  };
}

export async function updateUserStatus(admin, userId, status) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Invalid user status");
  }

  const user = findUserOrThrow(userId);
  user.status = status;
  const entry = recordAudit(admin, `user.${status}`, "user", userId, `Set user status to ${status}`);
  return { user, audit: entry };
}

export async function listFlaggedJobs(query = {}) {
  const status = query.status;
  const filtered = jobs.filter((job) => {
    const flagged = job.flagged || job.moderationStatus !== "approved";
    const matchesStatus = !status || status === "all" || job.moderationStatus === status;
    return flagged && matchesStatus;
  });
  return paginate(filtered, query);
}

export async function moderateJob(admin, jobId, decision, reason = "") {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw new Error("Invalid moderation decision");
  }

  const job = findJobOrThrow(jobId);
  job.moderationStatus = decision;
  job.flagged = decision !== "approved";

  if (decision === "rejected") {
    job.status = "rejected";
    addNotification(job.clientId, `Your listing "${job.title}" was rejected: ${reason || "Policy review"}`);
  }

  const entry = recordAudit(
    admin,
    `job.${decision}`,
    "job",
    jobId,
    reason || `Listing ${decision}`
  );
  return { job, audit: entry };
}

export async function listDisputes(query = {}) {
  const status = query.status;
  const filtered = disputes.filter((dispute) => !status || status === "all" || dispute.status === status);
  return paginate(filtered, query);
}

export async function ruleOnDispute(admin, disputeId, ruling, note = "") {
  if (!["client", "freelancer", "refund", "escalate"].includes(ruling)) {
    throw new Error("Invalid dispute ruling");
  }

  const dispute = findDisputeOrThrow(disputeId);
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionNote = note;

  addNotification(dispute.clientId, `Dispute ${dispute.id} updated: ${ruling}`);
  addNotification(dispute.freelancerId, `Dispute ${dispute.id} updated: ${ruling}`);

  const entry = recordAudit(
    admin,
    `dispute.${ruling}`,
    "dispute",
    disputeId,
    note || `Dispute ruled for ${ruling}`
  );
  return { dispute, audit: entry };
}

export async function getPlatformControls() {
  return controls;
}

export async function updatePlatformControl(admin, key, enabled) {
  if (!["registrationsEnabled", "jobPostingsEnabled"].includes(key)) {
    throw new Error("Invalid platform control");
  }

  controls[key] = Boolean(enabled);
  const entry = recordAudit(
    admin,
    `control.${key}`,
    "platform-control",
    key,
    `${key} set to ${controls[key]}`
  );
  return { controls, audit: entry };
}

export async function listAuditLog(query = {}) {
  const action = query.action;
  const adminId = query.adminId;
  const from = query.from;
  const to = query.to;

  const filtered = auditLog.filter((entry) => {
    const matchesAction = !action || action === "all" || entry.action === action;
    const matchesAdmin = !adminId || entry.adminId === adminId;
    const matchesFrom = !from || entry.createdAt >= from;
    const matchesTo = !to || entry.createdAt <= to;
    return matchesAction && matchesAdmin && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}

export async function getNotifications() {
  return notifications;
}
