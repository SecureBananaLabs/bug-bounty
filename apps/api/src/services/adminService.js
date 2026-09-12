const users = [
  {
    id: "usr_1001",
    name: "Maya Ortiz",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01",
    trustScore: 92,
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_1002",
    name: "Theo Banks",
    email: "theo@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-03",
    trustScore: 86,
    activeJobs: 2,
    disputes: 1
  },
  {
    id: "usr_1003",
    name: "Rin Carter",
    email: "rin@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-04",
    trustScore: 41,
    activeJobs: 0,
    disputes: 2
  },
  {
    id: "usr_1004",
    name: "Ari Singh",
    email: "ari@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-07",
    trustScore: 78,
    activeJobs: 1,
    disputes: 1
  }
];

const moderationQueue = [
  {
    id: "job_2001",
    title: "Scrape private marketplace leads",
    clientId: "usr_1004",
    clientName: "Ari Singh",
    reason: "Automated rule flagged private-data scraping language",
    status: "flagged",
    reportedBy: "policy-scanner",
    createdAt: "2026-05-18T14:30:00.000Z"
  },
  {
    id: "job_2002",
    title: "Emergency payment integration",
    clientId: "usr_1001",
    clientName: "Maya Ortiz",
    reason: "User report: unclear escrow terms",
    status: "under_review",
    reportedBy: "usr_1002",
    createdAt: "2026-05-19T09:15:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_3001",
    jobId: "job_2002",
    freelancerId: "usr_1002",
    clientId: "usr_1001",
    status: "open",
    amount: 850,
    openedAt: "2026-05-19T18:20:00.000Z",
    thread: [
      "Client says milestone is incomplete.",
      "Freelancer says API tests and handoff are complete."
    ],
    evidence: ["handoff.md", "api-test-output.txt"]
  },
  {
    id: "dsp_3002",
    jobId: "job_2003",
    freelancerId: "usr_1003",
    clientId: "usr_1004",
    status: "under_review",
    amount: 420,
    openedAt: "2026-05-20T11:05:00.000Z",
    thread: ["Client claims work was copied.", "Freelancer provided commit history."],
    evidence: ["commit-log.txt", "screen-recording.mp4"]
  }
];

const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-18T12:00:00.000Z",
    updatedBy: "system"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-18T12:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "system",
    actionType: "control.updated",
    targetId: "registrations",
    summary: "Registrations enabled during platform boot",
    createdAt: "2026-05-18T12:00:00.000Z"
  }
];

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function recordAudit(adminId, actionType, targetId, summary) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetId,
    summary,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function trustDistribution() {
  return {
    high: users.filter((user) => user.trustScore >= 80).length,
    medium: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
    low: users.filter((user) => user.trustScore < 50).length
  };
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((job) => job.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: trustDistribution()
  };
}

export async function getAdminOverview() {
  return {
    metrics: await getAdminMetrics(),
    controls: Object.values(platformControls),
    latestAudit: auditLog.slice(0, 5)
  };
}

export async function listAdminUsers(query = {}) {
  const q = String(query.q ?? "").toLowerCase();
  const role = query.role;
  const status = query.status;
  const filtered = users.filter((user) => {
    const matchesQuery =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.id.toLowerCase().includes(q);
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    return matchesQuery && matchesRole && matchesStatus;
  });

  return paginate(filtered, query);
}

export async function updateUserStatus(userId, payload, adminId) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(payload.status)) {
    throw new Error("Invalid user status");
  }

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = payload.status;
  const audit = recordAudit(
    adminId,
    "user.status_updated",
    user.id,
    `${user.name} marked ${payload.status}${payload.reason ? `: ${payload.reason}` : ""}`
  );

  return { user, audit };
}

export async function listModerationQueue(query = {}) {
  const status = query.status;
  const filtered = moderationQueue.filter((job) => !status || job.status === status);
  return paginate(filtered, query);
}

export async function decideModerationListing(jobId, payload, adminId) {
  const allowed = new Set(["approved", "rejected", "escalated"]);
  if (!allowed.has(payload.decision)) {
    throw new Error("Invalid moderation decision");
  }

  const job = moderationQueue.find((candidate) => candidate.id === jobId);
  if (!job) {
    throw new Error("Moderation item not found");
  }

  job.status = payload.decision;
  job.resolutionReason = payload.reason ?? "";
  const audit = recordAudit(
    adminId,
    "listing.moderated",
    job.id,
    `${job.title} ${payload.decision}${payload.reason ? `: ${payload.reason}` : ""}`
  );

  return {
    job,
    audit,
    notification: {
      userId: job.clientId,
      title: `Listing ${payload.decision}`,
      body: payload.reason ?? "A platform moderator reviewed your listing."
    }
  };
}

export async function listAdminDisputes(query = {}) {
  const status = query.status;
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);
  return paginate(filtered, query);
}

export async function resolveDispute(disputeId, payload, adminId) {
  const allowed = new Set(["client", "freelancer", "senior_admin"]);
  if (!allowed.has(payload.ruling)) {
    throw new Error("Invalid dispute ruling");
  }

  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new Error("Dispute not found");
  }

  dispute.status = payload.ruling === "senior_admin" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.resolutionNote = payload.note ?? "";
  const audit = recordAudit(
    adminId,
    "dispute.ruled",
    dispute.id,
    `Ruling: ${payload.ruling}${payload.note ? `: ${payload.note}` : ""}`
  );

  const refund =
    payload.ruling === "client"
      ? {
          id: `ref_${dispute.id}`,
          amount: dispute.amount,
          status: "queued",
          recipientUserId: dispute.clientId
        }
      : null;

  return {
    dispute,
    audit,
    refund,
    notifications: [
      {
        userId: dispute.clientId,
        title: "Dispute updated",
        body: `Admin ruling: ${payload.ruling}`
      },
      {
        userId: dispute.freelancerId,
        title: "Dispute updated",
        body: `Admin ruling: ${payload.ruling}`
      }
    ]
  };
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function updatePlatformControl(controlKey, payload, adminId) {
  const control = platformControls[controlKey];
  if (!control) {
    throw new Error("Platform control not found");
  }

  control.enabled = Boolean(payload.enabled);
  control.updatedAt = new Date().toISOString();
  control.updatedBy = adminId;
  const audit = recordAudit(
    adminId,
    "control.updated",
    control.key,
    `${control.label} ${control.enabled ? "enabled" : "disabled"}`
  );

  return { control, audit };
}

export async function listAdminAuditLog(query = {}) {
  const actionType = query.actionType;
  const adminId = query.adminId;
  const from = query.from ? Date.parse(query.from) : null;
  const to = query.to ? Date.parse(query.to) : null;
  const filtered = auditLog.filter((entry) => {
    const createdAt = Date.parse(entry.createdAt);
    const matchesAction = !actionType || entry.actionType === actionType;
    const matchesAdmin = !adminId || entry.adminId === adminId;
    const matchesFrom = !from || createdAt >= from;
    const matchesTo = !to || createdAt <= to;
    return matchesAction && matchesAdmin && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}
