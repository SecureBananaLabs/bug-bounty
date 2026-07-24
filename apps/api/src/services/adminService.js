const users = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14",
    trustScore: 96,
    activeJobs: 4,
    disputes: 0
  },
  {
    id: "usr_1002",
    name: "Jordan Lee",
    email: "jordan@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-03-02",
    trustScore: 89,
    activeJobs: 2,
    disputes: 1
  },
  {
    id: "usr_1003",
    name: "Riley Stone",
    email: "riley@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-04-11",
    trustScore: 54,
    activeJobs: 1,
    disputes: 2
  },
  {
    id: "usr_1004",
    name: "Avery Patel",
    email: "avery@example.com",
    role: "client",
    status: "banned",
    joinedAt: "2026-01-20",
    trustScore: 18,
    activeJobs: 0,
    disputes: 4
  }
];

const flaggedJobs = [
  {
    id: "flag_2001",
    jobId: "job_3001",
    title: "Scrape competitor customer data",
    client: "Avery Patel",
    reason: "Potential policy violation",
    severity: "high",
    status: "pending",
    flaggedAt: "2026-05-27T14:21:00.000Z"
  },
  {
    id: "flag_2002",
    jobId: "job_3002",
    title: "Rebuild checkout analytics dashboard",
    client: "Jordan Lee",
    reason: "Budget anomaly",
    severity: "medium",
    status: "pending",
    flaggedAt: "2026-05-28T09:05:00.000Z"
  },
  {
    id: "flag_2003",
    jobId: "job_3003",
    title: "Write landing page copy",
    client: "Nora Kim",
    reason: "Repeated report from freelancers",
    severity: "low",
    status: "escalated",
    flaggedAt: "2026-05-29T16:44:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_4001",
    client: "Jordan Lee",
    freelancer: "Maya Chen",
    jobTitle: "API billing integration",
    amount: 2400,
    status: "open",
    updatedAt: "2026-05-29T20:12:00.000Z",
    evidenceCount: 5,
    transactionId: "pi_928391",
    thread: [
      "Client says milestone 2 is incomplete.",
      "Freelancer uploaded delivery notes and test evidence.",
      "Escrow payment is currently held."
    ],
    ruling: null
  },
  {
    id: "dsp_4002",
    client: "Nora Kim",
    freelancer: "Riley Stone",
    jobTitle: "Brand refresh deck",
    amount: 850,
    status: "under_review",
    updatedAt: "2026-05-28T11:33:00.000Z",
    evidenceCount: 3,
    transactionId: "pi_928407",
    thread: [
      "Freelancer missed the revision window.",
      "Client uploaded the original scope document."
    ],
    ruling: null
  }
];

const platformControls = {
  registrations: {
    enabled: true,
    label: "New user registrations",
    updatedBy: "admin_demo",
    updatedAt: "2026-05-29T19:15:00.000Z"
  },
  jobPostings: {
    enabled: true,
    label: "New job postings",
    updatedBy: "admin_demo",
    updatedAt: "2026-05-29T19:15:00.000Z"
  }
};

const auditLog = [
  {
    id: "aud_5001",
    adminId: "admin_demo",
    action: "user.suspend",
    target: "usr_1003",
    details: "Suspended while dispute evidence is reviewed.",
    createdAt: "2026-05-29T18:41:00.000Z"
  },
  {
    id: "aud_5002",
    adminId: "admin_demo",
    action: "job.escalate",
    target: "flag_2003",
    details: "Escalated repeated report to senior moderation.",
    createdAt: "2026-05-29T19:02:00.000Z"
  }
];

function recordAudit(adminId, action, target, details) {
  const entry = {
    id: `aud_${Date.now()}`,
    adminId,
    action,
    target,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function paginate(items, page = 1, pageSize = 10) {
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

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { range: "0-39", count: users.filter((user) => user.trustScore < 40).length },
      { range: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
      { range: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ]
  };
}

export async function listAdminUsers(filters = {}) {
  const search = filters.search?.toLowerCase() ?? "";
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search);
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return paginate(filtered, filters.page, filters.pageSize);
}

export async function setUserStatus(userId, status, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  const action = status === "active" ? "user.reinstate" : `user.${status}`;
  const audit = recordAudit(adminId, action, userId, `Set user status to ${status}.`);
  return { user, audit };
}

export async function listFlaggedJobs(filters = {}) {
  const filtered = flaggedJobs.filter((job) => !filters.status || job.status === filters.status);
  return paginate(filtered, filters.page, filters.pageSize);
}

export async function decideFlaggedJob(flagId, decision, reason, adminId) {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw new Error("Unsupported moderation decision");
  }

  const job = flaggedJobs.find((entry) => entry.id === flagId);
  if (!job) {
    throw new Error("Flagged job not found");
  }

  job.status = decision;
  job.resolutionReason = reason ?? "";
  const audit = recordAudit(adminId, `job.${decision}`, flagId, job.resolutionReason);
  return {
    job,
    notification: decision === "rejected" ? `Client ${job.client} notified with reason: ${job.resolutionReason}` : null,
    audit
  };
}

export async function listDisputes(filters = {}) {
  const filtered = disputes.filter((dispute) => !filters.status || dispute.status === filters.status);
  return paginate(filtered, filters.page, filters.pageSize);
}

export async function ruleOnDispute(disputeId, ruling, adminId) {
  if (!["client", "freelancer", "refund", "escalate"].includes(ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  const dispute = disputes.find((entry) => entry.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  dispute.ruling = ruling;
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.updatedAt = new Date().toISOString();

  const audit = recordAudit(adminId, `dispute.${ruling}`, disputeId, `Ruling applied to ${dispute.jobTitle}.`);
  return {
    dispute,
    notifications: [`${dispute.client} notified`, `${dispute.freelancer} notified`],
    audit
  };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function setPlatformControl(control, enabled, adminId) {
  if (!platformControls[control]) {
    throw new Error("Platform control not found");
  }

  platformControls[control].enabled = Boolean(enabled);
  platformControls[control].updatedBy = adminId;
  platformControls[control].updatedAt = new Date().toISOString();

  const audit = recordAudit(
    adminId,
    `platform.${control}`,
    control,
    `${platformControls[control].label} ${enabled ? "enabled" : "disabled"}.`
  );

  return { control: platformControls[control], audit };
}

export async function listAuditLog(filters = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !filters.adminId || entry.adminId === filters.adminId;
    const matchesAction = !filters.action || entry.action === filters.action;
    const matchesFrom = !filters.from || entry.createdAt >= filters.from;
    const matchesTo = !filters.to || entry.createdAt <= filters.to;
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });

  return paginate(filtered, filters.page, filters.pageSize);
}
