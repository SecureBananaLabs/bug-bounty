const users = [
  {
    id: "usr_admin",
    name: "Amina Shah",
    email: "amina.admin@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2025-11-11T10:00:00.000Z",
    trustScore: 98,
    activeJobs: 0,
    disputeCount: 0
  },
  {
    id: "usr_client_1",
    name: "Marcus Reed",
    email: "marcus@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-18T13:20:00.000Z",
    trustScore: 83,
    activeJobs: 3,
    disputeCount: 1
  },
  {
    id: "usr_client_2",
    name: "Nadia Brooks",
    email: "nadia@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-02-03T08:45:00.000Z",
    trustScore: 54,
    activeJobs: 1,
    disputeCount: 2
  },
  {
    id: "usr_freelancer_1",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-14T15:10:00.000Z",
    trustScore: 91,
    activeJobs: 4,
    disputeCount: 0
  },
  {
    id: "usr_freelancer_2",
    name: "Priya Raman",
    email: "priya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-26T17:00:00.000Z",
    trustScore: 77,
    activeJobs: 2,
    disputeCount: 1
  },
  {
    id: "usr_freelancer_3",
    name: "Caleb Fox",
    email: "caleb@example.com",
    role: "freelancer",
    status: "banned",
    joinedAt: "2026-04-09T09:30:00.000Z",
    trustScore: 31,
    activeJobs: 0,
    disputeCount: 4
  }
];

const jobs = [
  {
    id: "job_101",
    title: "Stripe checkout hardening",
    clientId: "usr_client_1",
    clientName: "Marcus Reed",
    status: "active",
    budget: 2400,
    flagged: false,
    createdAt: "2026-04-12T12:00:00.000Z"
  },
  {
    id: "job_102",
    title: "Suspicious scraping project",
    clientId: "usr_client_2",
    clientName: "Nadia Brooks",
    status: "flagged",
    budget: 450,
    flagged: true,
    flagReason: "Automated policy flagged possible credential harvesting wording.",
    reportCount: 3,
    createdAt: "2026-05-13T12:00:00.000Z"
  },
  {
    id: "job_103",
    title: "Mobile app onboarding flow",
    clientId: "usr_client_1",
    clientName: "Marcus Reed",
    status: "flagged",
    budget: 1200,
    flagged: true,
    flagReason: "Two user reports mention misleading scope changes.",
    reportCount: 2,
    createdAt: "2026-05-15T16:30:00.000Z"
  },
  {
    id: "job_104",
    title: "Marketplace SEO audit",
    clientId: "usr_client_1",
    clientName: "Marcus Reed",
    status: "active",
    budget: 800,
    flagged: false,
    createdAt: "2026-05-02T11:00:00.000Z"
  }
];

const disputes = [
  {
    id: "disp_501",
    jobId: "job_101",
    title: "Milestone delivery dispute",
    freelancerId: "usr_freelancer_2",
    freelancerName: "Priya Raman",
    clientId: "usr_client_1",
    clientName: "Marcus Reed",
    amount: 900,
    status: "open",
    openedAt: "2026-05-12T09:15:00.000Z",
    thread: [
      "Client says milestone two was incomplete.",
      "Freelancer provided deployment notes and screen recording."
    ],
    evidence: ["deployment-log.txt", "handoff-video.mp4"]
  },
  {
    id: "disp_502",
    jobId: "job_102",
    title: "Scope changed after acceptance",
    freelancerId: "usr_freelancer_3",
    freelancerName: "Caleb Fox",
    clientId: "usr_client_2",
    clientName: "Nadia Brooks",
    amount: 450,
    status: "under_review",
    openedAt: "2026-05-16T18:40:00.000Z",
    thread: [
      "Freelancer says new requirements were introduced after contract acceptance.",
      "Client says the posted task was always security research."
    ],
    evidence: ["original-brief.pdf", "message-thread.json"]
  }
];

let platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const notifications = [];

const auditLogs = [
  {
    id: "audit_1",
    adminId: "usr_admin",
    action: "platform.viewed",
    targetType: "admin_panel",
    targetId: "admin",
    details: "Initial admin panel access",
    createdAt: "2026-05-20T08:45:00.000Z"
  }
];

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate(items, query = {}) {
  const page = toPositiveInt(query.page, 1);
  const pageSize = Math.min(toPositiveInt(query.pageSize, 10), 50);
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

function includesText(value, search) {
  return String(value).toLowerCase().includes(String(search).toLowerCase());
}

function inDateRange(value, from, to) {
  const timestamp = new Date(value).getTime();
  if (from && timestamp < new Date(from).getTime()) return false;
  if (to && timestamp > new Date(to).getTime()) return false;
  return true;
}

function appendAudit(adminId, action, targetType, targetId, details) {
  const entry = {
    id: `audit_${auditLogs.length + 1}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLogs.unshift(entry);
  return entry;
}

function createNotification(userId, type, message) {
  const notification = {
    id: `note_${notifications.length + 1}`,
    userId,
    type,
    message,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notification);
  return notification;
}

function requireEntity(entity, label) {
  if (!entity) {
    const error = new Error(`${label} not found`);
    error.status = 404;
    throw error;
  }
  return entity;
}

function trustDistribution() {
  return [
    { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { label: "50-74", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 75).length },
    { label: "75-89", count: users.filter((user) => user.trustScore >= 75 && user.trustScore < 90).length },
    { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];
}

export async function getAdminOverview() {
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalUsers: users.length,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: jobs.filter((job) => job.status === "flagged").length,
      revenueCurrentPeriod: jobs.reduce((sum, job) => sum + job.budget, 0)
    },
    trustDistribution: trustDistribution(),
    platformControls
  };
}

export async function getAdminMetrics() {
  const overview = await getAdminOverview();
  return {
    openJobs: overview.totals.activeJobs,
    activeFreelancers: users.filter((user) => user.role === "freelancer" && user.status === "active").length,
    flaggedAccounts: users.filter((user) => user.status !== "active").length,
    monthlyVolume: overview.totals.revenueCurrentPeriod
  };
}

export async function listAdminUsers(query = {}) {
  const search = query.search?.trim();
  const filtered = users.filter((user) => {
    if (search && ![user.name, user.email, user.id].some((value) => includesText(value, search))) return false;
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    if (!inDateRange(user.joinedAt, query.joinedFrom, query.joinedTo)) return false;
    return true;
  });
  return paginate(filtered, query);
}

export async function getAdminUserProfile(userId) {
  const user = requireEntity(users.find((item) => item.id === userId), "User");
  return {
    ...user,
    jobs: jobs.filter((job) => job.clientId === user.id),
    disputes: disputes.filter((dispute) => dispute.clientId === user.id || dispute.freelancerId === user.id)
  };
}

export async function updateUserStatus(userId, status, adminId) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(status)) {
    const error = new Error("User status must be active, suspended, or banned");
    error.status = 400;
    throw error;
  }

  const user = requireEntity(users.find((item) => item.id === userId), "User");
  user.status = status;

  const audit = appendAudit(adminId, `user.${status}`, "user", userId, `User ${user.email} set to ${status}`);
  return { user, audit };
}

export async function listFlaggedListings(query = {}) {
  const status = query.status ?? "flagged";
  const filtered = jobs.filter((job) => {
    if (status !== "all" && job.status !== status) return false;
    if (query.search && ![job.title, job.clientName, job.flagReason ?? ""].some((value) => includesText(value, query.search))) {
      return false;
    }
    return true;
  });
  return paginate(filtered, query);
}

export async function moderateListing(jobId, payload, adminId) {
  const allowed = new Set(["approved", "rejected", "escalated"]);
  if (!allowed.has(payload.decision)) {
    const error = new Error("Decision must be approved, rejected, or escalated");
    error.status = 400;
    throw error;
  }

  const job = requireEntity(jobs.find((item) => item.id === jobId), "Job");
  job.status = payload.decision === "approved" ? "active" : payload.decision;
  job.flagged = payload.decision === "escalated";
  job.moderationReason = payload.reason ?? "";

  const audit = appendAudit(
    adminId,
    `listing.${payload.decision}`,
    "job",
    jobId,
    payload.reason ? `${job.title}: ${payload.reason}` : job.title
  );

  const notification =
    payload.decision === "rejected"
      ? createNotification(job.clientId, "listing_rejected", payload.reason ?? "Your listing was rejected by moderation.")
      : null;

  return { job, audit, notification };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => {
    if (query.status && dispute.status !== query.status) return false;
    if (query.search && ![dispute.title, dispute.clientName, dispute.freelancerName].some((value) => includesText(value, query.search))) {
      return false;
    }
    return true;
  });
  return paginate(filtered, query);
}

export async function ruleOnDispute(disputeId, payload, adminId) {
  const allowed = new Set(["client", "freelancer", "escalated"]);
  if (!allowed.has(payload.ruling)) {
    const error = new Error("Ruling must be client, freelancer, or escalated");
    error.status = 400;
    throw error;
  }

  const dispute = requireEntity(disputes.find((item) => item.id === disputeId), "Dispute");
  dispute.status = payload.ruling === "escalated" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingNotes = payload.notes ?? "";
  dispute.resolvedAt = payload.ruling === "escalated" ? null : new Date().toISOString();

  const audit = appendAudit(
    adminId,
    `dispute.${payload.ruling}`,
    "dispute",
    disputeId,
    payload.notes ? `${dispute.title}: ${payload.notes}` : dispute.title
  );

  const notificationsCreated = [
    createNotification(dispute.clientId, "dispute_update", `Dispute ${dispute.id} ruling: ${payload.ruling}`),
    createNotification(dispute.freelancerId, "dispute_update", `Dispute ${dispute.id} ruling: ${payload.ruling}`)
  ];

  return { dispute, audit, notifications: notificationsCreated, refundTriggered: payload.ruling === "client" };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(control, enabled, adminId) {
  if (!Object.hasOwn(platformControls, control)) {
    const error = new Error("Unknown platform control");
    error.status = 404;
    throw error;
  }
  if (typeof enabled !== "boolean") {
    const error = new Error("Control value must be a boolean");
    error.status = 400;
    throw error;
  }

  platformControls = { ...platformControls, [control]: enabled };
  const audit = appendAudit(adminId, `control.${control}`, "platform_control", control, `${control} set to ${enabled}`);
  return { controls: platformControls, audit };
}

export async function listAuditLogs(query = {}) {
  const filtered = auditLogs.filter((entry) => {
    if (query.adminId && entry.adminId !== query.adminId) return false;
    if (query.action && entry.action !== query.action) return false;
    if (!inDateRange(entry.createdAt, query.from, query.to)) return false;
    return true;
  });
  return paginate(filtered, query);
}
