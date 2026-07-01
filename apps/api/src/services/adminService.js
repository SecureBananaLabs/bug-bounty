const users = [
  {
    id: "usr_admin",
    name: "Avery Admin",
    email: "admin@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    trustScore: 98,
    activeJobs: [],
    disputes: []
  },
  {
    id: "usr_client_1",
    name: "Mina Client",
    email: "mina@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-12",
    trustScore: 87,
    activeJobs: ["job-201", "job-204"],
    disputes: ["disp-301"]
  },
  {
    id: "usr_freelancer_1",
    name: "Devon Freelancer",
    email: "devon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-01",
    trustScore: 59,
    activeJobs: ["job-201"],
    disputes: ["disp-301", "disp-302"]
  },
  {
    id: "usr_client_2",
    name: "Iris Studio",
    email: "ops@iris.example",
    role: "client",
    status: "active",
    joinedAt: "2026-03-28",
    trustScore: 73,
    activeJobs: ["job-205"],
    disputes: []
  },
  {
    id: "usr_freelancer_2",
    name: "Ravi Builder",
    email: "ravi@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-08",
    trustScore: 91,
    activeJobs: ["job-204"],
    disputes: []
  },
  {
    id: "usr_client_3",
    name: "Beacon Labs",
    email: "finance@beacon.example",
    role: "client",
    status: "banned",
    joinedAt: "2026-04-22",
    trustScore: 31,
    activeJobs: [],
    disputes: ["disp-302"]
  }
];

const moderationJobs = [
  {
    id: "job-201",
    title: "Build escrow reconciliation dashboard",
    ownerId: "usr_client_1",
    ownerName: "Mina Client",
    status: "flagged",
    reportCount: 4,
    rule: "Payment terms mention external transfer",
    notification: null,
    updatedAt: "2026-05-19T18:20:00.000Z"
  },
  {
    id: "job-204",
    title: "Migrate support widget to server components",
    ownerId: "usr_client_1",
    ownerName: "Mina Client",
    status: "flagged",
    reportCount: 2,
    rule: "Budget mismatch against required skills",
    notification: null,
    updatedAt: "2026-05-20T05:41:00.000Z"
  },
  {
    id: "job-205",
    title: "Logo refresh with expedited payout",
    ownerId: "usr_client_2",
    ownerName: "Iris Studio",
    status: "escalated",
    reportCount: 8,
    rule: "High dispute risk from similar listings",
    notification: "Escalated to senior admin queue",
    updatedAt: "2026-05-20T09:30:00.000Z"
  }
];

const disputes = [
  {
    id: "disp-301",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    jobId: "job-201",
    status: "open",
    amount: 640,
    evidenceCount: 3,
    thread: [
      "Client says milestone two was incomplete.",
      "Freelancer attached a Loom walkthrough and commit hash.",
      "Escrow release is paused until admin ruling."
    ],
    evidence: ["loom-demo.mp4", "commit-7ac91.txt", "scope-change.pdf"],
    transactionId: "txn_9001",
    ruling: null,
    updatedAt: "2026-05-20T02:00:00.000Z"
  },
  {
    id: "disp-302",
    clientId: "usr_client_3",
    freelancerId: "usr_freelancer_1",
    jobId: "job-207",
    status: "under_review",
    amount: 1200,
    evidenceCount: 5,
    thread: [
      "Freelancer claims client changed acceptance criteria after delivery.",
      "Client account was banned after repeated off-platform payment attempts."
    ],
    evidence: ["contract.json", "chat-export.txt", "invoice.pdf", "delivery.zip", "admin-note.md"],
    transactionId: "txn_9002",
    ruling: null,
    updatedAt: "2026-05-19T21:45:00.000Z"
  }
];

const controls = [
  {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-18T14:20:00.000Z",
    updatedBy: "usr_admin"
  },
  {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-18T14:20:00.000Z",
    updatedBy: "usr_admin"
  }
];

const auditLog = [
  {
    id: "audit-001",
    adminId: "usr_admin",
    action: "platform.control.updated",
    targetId: "registrations",
    detail: "Enabled new user registrations",
    createdAt: "2026-05-18T14:20:00.000Z"
  },
  {
    id: "audit-002",
    adminId: "usr_admin",
    action: "moderation.job.escalated",
    targetId: "job-205",
    detail: "Escalated high-risk listing",
    createdAt: "2026-05-20T09:30:00.000Z"
  }
];

function paginate(items, { page, pageSize }) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

function notFound(entity, id) {
  const error = new Error(`${entity} ${id} not found`);
  error.status = 404;
  return error;
}

function actorId(admin) {
  return admin?.sub ?? admin?.id ?? "usr_admin";
}

function appendAudit(admin, action, targetId, detail) {
  const entry = {
    id: `audit-${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId: actorId(admin),
    action,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };

  auditLog.unshift(entry);
  return entry;
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationJobs.filter((job) => job.status === "flagged").length;
  const activeJobs = new Set(users.flatMap((user) => user.activeJobs)).size;
  const totalRevenue = disputes.reduce((sum, dispute) => sum + dispute.amount, 0);

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: totalRevenue,
    trustScoreDistribution: {
      high: users.filter((user) => user.trustScore >= 80).length,
      medium: users.filter((user) => user.trustScore >= 60 && user.trustScore < 80).length,
      low: users.filter((user) => user.trustScore < 60).length
    },
    controls: controls.reduce((summary, control) => {
      summary[control.key] = control.enabled;
      return summary;
    }, {})
  };
}

export async function getUsers(query) {
  const needle = query.search?.toLowerCase();
  const filtered = users.filter((user) => {
    const matchesRole = query.role ? user.role === query.role : true;
    const matchesStatus = query.status ? user.status === query.status : true;
    const matchesSearch = needle
      ? [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(needle))
      : true;
    return matchesRole && matchesStatus && matchesSearch;
  });

  return paginate(filtered, query);
}

export async function getUser(id) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) throw notFound("User", id);

  return {
    ...user,
    jobs: moderationJobs.filter((job) => user.activeJobs.includes(job.id)),
    disputeHistory: disputes.filter((dispute) => user.disputes.includes(dispute.id))
  };
}

export async function setUserAccountStatus(id, payload, admin) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) throw notFound("User", id);

  user.status = payload.status;
  const audit = appendAudit(
    admin,
    `user.${payload.status}`,
    id,
    `${user.email} set to ${payload.status}: ${payload.reason}`
  );

  return { user, audit };
}

export async function getModerationJobs(query) {
  const filtered = query.status
    ? moderationJobs.filter((job) => job.status === query.status)
    : moderationJobs;

  return paginate(filtered, query);
}

export async function recordListingDecision(id, payload, admin) {
  const job = moderationJobs.find((candidate) => candidate.id === id);
  if (!job) throw notFound("Listing", id);

  job.status = payload.decision;
  job.notification =
    payload.decision === "rejected"
      ? `Listing rejected: ${payload.reason}`
      : `Listing ${payload.decision}: ${payload.reason}`;
  job.updatedAt = new Date().toISOString();

  const audit = appendAudit(
    admin,
    `moderation.job.${payload.decision}`,
    id,
    `${job.title}: ${payload.reason}`
  );

  return { job, notification: job.notification, audit };
}

export async function getDisputes(query) {
  const filtered = query.status
    ? disputes.filter((dispute) => dispute.status === query.status)
    : disputes;

  return paginate(filtered, query);
}

export async function getDispute(id) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) throw notFound("Dispute", id);
  return dispute;
}

export async function recordDisputeRuling(id, payload, admin) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) throw notFound("Dispute", id);

  dispute.status = payload.ruling === "escalated" ? "escalated" : "resolved";
  dispute.ruling = {
    winner: payload.ruling,
    reason: payload.reason,
    ruledBy: actorId(admin),
    ruledAt: new Date().toISOString(),
    refundTriggered: payload.ruling === "refund"
  };
  dispute.updatedAt = dispute.ruling.ruledAt;

  const audit = appendAudit(
    admin,
    `dispute.${payload.ruling}`,
    id,
    `Dispute ${id} ruled ${payload.ruling}: ${payload.reason}`
  );

  return {
    dispute,
    notifications: [
      `Client notified for ${id}`,
      `Freelancer notified for ${id}`
    ],
    audit
  };
}

export async function getControls() {
  return controls;
}

export async function setPlatformControl(key, payload, admin) {
  const control = controls.find((candidate) => candidate.key === key);
  if (!control) throw notFound("Control", key);

  control.enabled = payload.enabled;
  control.updatedAt = new Date().toISOString();
  control.updatedBy = actorId(admin);

  const audit = appendAudit(
    admin,
    "platform.control.updated",
    key,
    `${control.label} ${payload.enabled ? "enabled" : "disabled"}`
  );

  return { control, audit };
}

export async function getAuditLog(query) {
  const from = query.dateFrom ? Date.parse(query.dateFrom) : null;
  const to = query.dateTo ? Date.parse(query.dateTo) : null;
  const filtered = auditLog.filter((entry) => {
    const created = Date.parse(entry.createdAt);
    const matchesAdmin = query.adminId ? entry.adminId === query.adminId : true;
    const matchesAction = query.action ? entry.action.includes(query.action) : true;
    const afterFrom = from ? created >= from : true;
    const beforeTo = to ? created <= to : true;
    return matchesAdmin && matchesAction && afterFrom && beforeTo;
  });

  return paginate(filtered, query);
}
