const state = {
  users: [
    {
      id: "usr-admin-1",
      name: "Amina Rahman",
      email: "amina@securebanana.dev",
      role: "admin",
      status: "active",
      joinedAt: "2026-03-02T08:15:00.000Z",
      trustScore: 98,
      activeJobs: 2,
      disputes: 0,
      location: "Dubai, UAE"
    },
    {
      id: "usr-client-1",
      name: "Jordan Lee",
      email: "jordan@northstar.io",
      role: "client",
      status: "active",
      joinedAt: "2026-03-09T13:45:00.000Z",
      trustScore: 91,
      activeJobs: 4,
      disputes: 1,
      location: "Austin, US"
    },
    {
      id: "usr-freelancer-1",
      name: "Maya Patel",
      email: "maya@craft.dev",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-03-11T10:20:00.000Z",
      trustScore: 89,
      activeJobs: 3,
      disputes: 0,
      location: "London, UK"
    },
    {
      id: "usr-client-2",
      name: "Riley Chen",
      email: "riley@cloudnine.app",
      role: "client",
      status: "suspended",
      joinedAt: "2026-03-14T17:05:00.000Z",
      trustScore: 42,
      activeJobs: 1,
      disputes: 2,
      location: "Seattle, US"
    },
    {
      id: "usr-freelancer-2",
      name: "Sofia Gomez",
      email: "sofia@frame.studio",
      role: "freelancer",
      status: "banned",
      joinedAt: "2026-03-15T09:40:00.000Z",
      trustScore: 12,
      activeJobs: 0,
      disputes: 3,
      location: "Valencia, ES"
    }
  ],
  jobs: [
    {
      id: "job-501",
      title: "Build a customer support portal",
      client: "Northstar",
      status: "flagged",
      budget: "$8,500",
      reason: "Automated rule: repeated contact detail changes",
      createdAt: "2026-05-12T09:00:00.000Z",
      reviewerNotes: "Needs manual review"
    },
    {
      id: "job-502",
      title: "Design onboarding for a fintech launch",
      client: "CloudNine",
      status: "approved",
      budget: "$4,200",
      reason: "",
      createdAt: "2026-05-10T11:25:00.000Z",
      reviewerNotes: "Passed trust checks"
    },
    {
      id: "job-503",
      title: "Rewrite product marketing homepage",
      client: "Frame Studio",
      status: "escalated",
      budget: "$2,900",
      reason: "User report: suspected duplicate listing",
      createdAt: "2026-05-13T15:30:00.000Z",
      reviewerNotes: "Senior admin review requested"
    }
  ],
  disputes: [
    {
      id: "dsp-301",
      client: "Jordan Lee",
      freelancer: "Maya Patel",
      status: "open",
      amount: "$1,200",
      updatedAt: "2026-05-15T12:00:00.000Z",
      thread: "Scope changed after kickoff; deliverable needs clarification.",
      evidence: "contract.pdf, chat-export.txt",
      transactionId: "pay_7712"
    },
    {
      id: "dsp-302",
      client: "Riley Chen",
      freelancer: "Sofia Gomez",
      status: "under_review",
      amount: "$680",
      updatedAt: "2026-05-16T10:20:00.000Z",
      thread: "Client requested partial refund after missed milestone.",
      evidence: "invoice.png, milestone-notes.docx",
      transactionId: "pay_8851"
    },
    {
      id: "dsp-303",
      client: "Northstar",
      freelancer: "Maya Patel",
      status: "resolved",
      amount: "$3,400",
      updatedAt: "2026-05-08T17:45:00.000Z",
      thread: "Refund issued after duplicate approval path.",
      evidence: "refund-receipt.pdf",
      transactionId: "pay_6120"
    }
  ],
  controls: {
    registrationsEnabled: true,
    jobPostingsEnabled: true
  },
  auditLog: [
    {
      id: "audit-901",
      timestamp: "2026-05-16T10:30:00.000Z",
      adminId: "usr-admin-1",
      action: "flag-review",
      target: "job-503",
      details: "Escalated duplicate listing for senior review"
    },
    {
      id: "audit-902",
      timestamp: "2026-05-16T11:15:00.000Z",
      adminId: "usr-admin-1",
      action: "user-suspend",
      target: "usr-client-2",
      details: "Suspended after repeated policy violations"
    }
  ]
};

function clone(value) {
  return structuredClone(value);
}

function paginate(items, page = 1, pageSize = 10) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: clone(items.slice(start, end)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

function appendAudit(entry) {
  state.auditLog.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry
  });
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getUserById(userId) {
  return state.users.find((user) => user.id === userId);
}

function getJobById(jobId) {
  return state.jobs.find((job) => job.id === jobId);
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchQuery(value, query) {
  if (!query) {
    return true;
  }

  return value.toLowerCase().includes(query.toLowerCase());
}

export async function getAdminOverview() {
  const totalUsers = state.users.length;
  const activeJobs = state.jobs.filter((job) => job.status === "approved").length;
  const openDisputes = state.disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = state.jobs.filter((job) => job.status !== "approved").length;
  const revenue = state.jobs.reduce((sum, job) => {
    const amount = Number(job.budget.replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const trustScoreDistribution = [
    { label: "90-100", count: state.users.filter((user) => user.trustScore >= 90).length },
    { label: "70-89", count: state.users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { label: "40-69", count: state.users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
    { label: "0-39", count: state.users.filter((user) => user.trustScore < 40).length }
  ];

  return {
    summary: {
      totalUsers,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue: revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    },
    trustScoreDistribution,
    controls: clone(state.controls),
    recentAudit: clone(state.auditLog.slice(0, 5))
  };
}

export async function getAdminMetrics() {
  const overview = await getAdminOverview();
  return overview.summary;
}

export async function listAdminUsers(query) {
  const filters = state.users.filter((user) => {
    const joinedAt = toDate(user.joinedAt);
    const joinedAfter = query.joinedAfter ? toDate(query.joinedAfter) : null;

    if (query.role && user.role !== query.role) {
      return false;
    }

    if (query.status && user.status !== query.status) {
      return false;
    }

    if (joinedAfter && joinedAt && joinedAt < joinedAfter) {
      return false;
    }

    return matchQuery(`${user.name} ${user.email} ${user.location}`, query.q);
  });

  const ordered = filters.sort((a, b) => toDate(b.joinedAt) - toDate(a.joinedAt));
  return paginate(ordered, query.page, query.pageSize);
}

export async function setAdminUserStatus(userId, payload, actor) {
  const user = getUserById(userId);
  if (!user) {
    throw createHttpError(404, `User ${userId} was not found`);
  }

  const nextStatus = {
    suspend: "suspended",
    reinstate: "active",
    ban: "banned"
  }[payload.action];

  user.status = nextStatus;
  appendAudit({
    adminId: actor.sub,
    action: `user-${payload.action}`,
    target: user.id,
    details: `${payload.reason} | ${user.email}`
  });

  return { user: clone(user), message: `User ${user.name} updated to ${nextStatus}.` };
}

export async function listAdminJobs(query) {
  const filtered = state.jobs.filter((job) => {
    if (query.status && job.status !== query.status) {
      return false;
    }

    return matchQuery(`${job.title} ${job.client} ${job.reason} ${job.reviewerNotes}`, query.q);
  });

  const ordered = filtered.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
  return paginate(ordered, query.page, query.pageSize);
}

export async function reviewAdminJob(jobId, payload, actor) {
  const job = getJobById(jobId);
  if (!job) {
    throw createHttpError(404, `Job ${jobId} was not found`);
  }

  const nextStatus = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  }[payload.decision];

  job.status = nextStatus;
  job.reviewerNotes = payload.reason;

  appendAudit({
    adminId: actor.sub,
    action: `job-${payload.decision}`,
    target: job.id,
    details: `${payload.reason} | ${job.title}`
  });

  return { job: clone(job), message: `Job ${job.title} marked ${nextStatus}.` };
}

export async function listAdminDisputes(query) {
  const filtered = state.disputes.filter((dispute) => {
    if (query.status && dispute.status !== query.status) {
      return false;
    }

    return matchQuery(
      `${dispute.client} ${dispute.freelancer} ${dispute.thread} ${dispute.evidence}`,
      query.q
    );
  });

  const ordered = filtered.sort((a, b) => toDate(b.updatedAt) - toDate(a.updatedAt));
  return paginate(ordered, query.page, query.pageSize);
}

export async function listAdminControls() {
  return clone(state.controls);
}

export async function setAdminControl(controlKey, enabled, actor) {
  if (!(controlKey in state.controls)) {
    throw createHttpError(400, `Unknown control ${controlKey}`);
  }

  state.controls[controlKey] = enabled;
  appendAudit({
    adminId: actor.sub,
    action: `control-${controlKey}`,
    target: controlKey,
    details: `Set to ${enabled ? "enabled" : "disabled"}`
  });

  return {
    control: controlKey,
    enabled
  };
}

export async function listAdminAuditLog(query) {
  const filtered = state.auditLog.filter((entry) => matchQuery(`${entry.action} ${entry.target} ${entry.details}`, query.q));
  const ordered = filtered.sort((a, b) => toDate(b.timestamp) - toDate(a.timestamp));
  return paginate(ordered, query.page, query.pageSize);
}
