const users = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    verified: true,
    trustScore: 94,
    joinedAt: "2026-01-18T10:00:00.000Z",
    flags: 0,
    totalSpend: 0,
    totalEarned: 38200
  },
  {
    id: "usr_1002",
    name: "Northstar Labs",
    email: "ops@northstar.example",
    role: "client",
    status: "active",
    verified: true,
    trustScore: 88,
    joinedAt: "2026-02-02T09:30:00.000Z",
    flags: 1,
    totalSpend: 74600,
    totalEarned: 0
  },
  {
    id: "usr_1003",
    name: "Owen Park",
    email: "owen@example.com",
    role: "freelancer",
    status: "flagged",
    verified: false,
    trustScore: 52,
    joinedAt: "2026-03-12T14:20:00.000Z",
    flags: 3,
    totalSpend: 0,
    totalEarned: 6400
  },
  {
    id: "usr_1004",
    name: "Aster Studio",
    email: "hello@aster.example",
    role: "client",
    status: "suspended",
    verified: false,
    trustScore: 41,
    joinedAt: "2026-04-05T08:45:00.000Z",
    flags: 4,
    totalSpend: 18900,
    totalEarned: 0
  },
  {
    id: "usr_admin",
    name: "Platform Admin",
    email: "admin@freelanceflow.example",
    role: "admin",
    status: "active",
    verified: true,
    trustScore: 100,
    joinedAt: "2025-12-01T08:00:00.000Z",
    flags: 0,
    totalSpend: 0,
    totalEarned: 0
  }
];

const jobs = [
  {
    id: "job_2001",
    title: "Refactor billing reconciliation flow",
    client: "Northstar Labs",
    category: "Backend",
    status: "open",
    moderationStatus: "clean",
    budget: 6200,
    proposals: 18,
    createdAt: "2026-05-09T11:30:00.000Z",
    risk: "low"
  },
  {
    id: "job_2002",
    title: "Build AI dashboard prototype",
    client: "Aster Studio",
    category: "Frontend",
    status: "paused",
    moderationStatus: "flagged",
    budget: 3100,
    proposals: 7,
    createdAt: "2026-05-12T15:10:00.000Z",
    risk: "high"
  },
  {
    id: "job_2003",
    title: "Audit marketplace notification templates",
    client: "Northstar Labs",
    category: "Operations",
    status: "closed",
    moderationStatus: "approved",
    budget: 900,
    proposals: 4,
    createdAt: "2026-05-04T13:05:00.000Z",
    risk: "medium"
  }
];

const disputes = [
  {
    id: "dsp_3001",
    jobId: "job_2002",
    client: "Aster Studio",
    freelancer: "Owen Park",
    amount: 1250,
    status: "open",
    priority: "high",
    reason: "Milestone delivered without required source files",
    openedAt: "2026-05-14T17:40:00.000Z"
  },
  {
    id: "dsp_3002",
    jobId: "job_2003",
    client: "Northstar Labs",
    freelancer: "Maya Chen",
    amount: 450,
    status: "reviewing",
    priority: "medium",
    reason: "Scope change after final approval",
    openedAt: "2026-05-15T10:25:00.000Z"
  }
];

const platformControls = [
  {
    id: "new_signups",
    label: "New signups",
    description: "Allow new client and freelancer registrations",
    enabled: true,
    updatedAt: "2026-05-15T09:00:00.000Z"
  },
  {
    id: "job_posting",
    label: "Job posting",
    description: "Allow clients to publish new job listings",
    enabled: true,
    updatedAt: "2026-05-15T09:00:00.000Z"
  },
  {
    id: "instant_payouts",
    label: "Instant payouts",
    description: "Allow eligible freelancers to request instant payouts",
    enabled: false,
    updatedAt: "2026-05-15T09:00:00.000Z"
  }
];

const auditLog = [
  {
    id: "aud_4001",
    actor: "usr_admin",
    type: "platform_control.updated",
    target: "instant_payouts",
    reason: "Risk review window",
    createdAt: "2026-05-15T09:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  const activeUsers = users.filter((user) => user.status === "active").length;
  const flaggedUsers = users.filter((user) => user.status === "flagged" || user.flags > 0).length;
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const monthlyVolume = users.reduce((sum, user) => sum + user.totalSpend + user.totalEarned, 0);
  const averageTrustScore = Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length);

  return {
    cards: [
      { label: "Active users", value: activeUsers },
      { label: "Flagged accounts", value: flaggedUsers },
      { label: "Open jobs", value: openJobs },
      { label: "Open disputes", value: openDisputes },
      { label: "Monthly volume", value: monthlyVolume },
      { label: "Average trust", value: averageTrustScore }
    ],
    trust: {
      average: averageTrustScore,
      healthy: users.filter((user) => user.trustScore >= 80).length,
      watch: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length,
      risky: users.filter((user) => user.trustScore < 60).length
    },
    queues: {
      userFlags: flaggedUsers,
      jobModeration: jobs.filter((job) => job.moderationStatus === "flagged").length,
      disputes: openDisputes
    }
  };
}

export async function listAdminUsers(query) {
  return paginate(filterRecords(users, query, ["name", "email", "role", "status"]), query);
}

export async function applyUserAction(userId, payload, actorId) {
  const user = findById(users, userId, "User");
  const before = { ...user };

  if (payload.action === "suspend") {
    user.status = "suspended";
  } else if (payload.action === "activate") {
    user.status = "active";
  } else if (payload.action === "verify") {
    user.verified = true;
    user.status = user.status === "suspended" ? "active" : user.status;
  } else {
    throw Object.assign(new Error("Unsupported user action"), { statusCode: 400 });
  }

  user.updatedAt = new Date().toISOString();
  appendAudit(actorId, "user.action", user.id, payload.reason, { action: payload.action, before, after: user });
  return user;
}

export async function listAdminJobs(query) {
  return paginate(filterRecords(jobs, query, ["title", "client", "category", "status", "moderationStatus"]), query);
}

export async function applyJobAction(jobId, payload, actorId) {
  const job = findById(jobs, jobId, "Job");
  const before = { ...job };

  if (payload.action === "feature") {
    job.featured = true;
  } else if (payload.action === "hide") {
    job.moderationStatus = "hidden";
    job.status = "paused";
  } else if (payload.action === "approve") {
    job.moderationStatus = "approved";
  } else if (payload.action === "close") {
    job.status = "closed";
  } else if (payload.action === "reopen") {
    job.status = "open";
  } else {
    throw Object.assign(new Error("Unsupported job action"), { statusCode: 400 });
  }

  job.updatedAt = new Date().toISOString();
  appendAudit(actorId, "job.action", job.id, payload.reason, { action: payload.action, before, after: job });
  return job;
}

export async function listDisputes(query) {
  return paginate(filterRecords(disputes, query, ["client", "freelancer", "status", "priority", "reason"]), query);
}

export async function resolveDispute(disputeId, payload, actorId) {
  const dispute = findById(disputes, disputeId, "Dispute");
  const before = { ...dispute };
  dispute.status = payload.resolution === "needs_more_evidence" ? "reviewing" : "resolved";
  dispute.resolution = payload.resolution;
  dispute.resolutionNote = payload.note;
  dispute.resolvedAt = new Date().toISOString();
  appendAudit(actorId, "dispute.resolved", dispute.id, payload.note, { before, after: dispute });
  return dispute;
}

export async function listPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(controlId, payload, actorId) {
  const control = findById(platformControls, controlId, "Platform control");
  const before = { ...control };
  control.enabled = payload.enabled;
  control.updatedAt = new Date().toISOString();
  appendAudit(actorId, "platform_control.updated", control.id, payload.reason, { before, after: control });
  return control;
}

export async function listAuditEvents(query) {
  return paginate(auditLog, query);
}

function filterRecords(records, query, fields) {
  const text = query.q.toLowerCase();
  return records.filter((record) => {
    const matchesText = !text || fields.some((field) => String(record[field] ?? "").toLowerCase().includes(text));
    const matchesRole = query.role === "all" || record.role === query.role;
    const matchesStatus = query.status === "all" || record.status === query.status || record.moderationStatus === query.status;
    return matchesText && matchesRole && matchesStatus;
  });
}

function paginate(records, query) {
  const total = records.length;
  const start = (query.page - 1) * query.limit;
  const data = records.slice(start, start + query.limit);

  return {
    data,
    page: query.page,
    limit: query.limit,
    total,
    pageCount: Math.max(1, Math.ceil(total / query.limit))
  };
}

function findById(records, id, label) {
  const record = records.find((item) => item.id === id);
  if (!record) {
    throw Object.assign(new Error(`${label} not found`), { statusCode: 404 });
  }
  return record;
}

function appendAudit(actor, type, target, reason, metadata = {}) {
  const event = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    actor,
    type,
    target,
    reason,
    metadata,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(event);
  return event;
}
