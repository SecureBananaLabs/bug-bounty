const users = [
  {
    id: "usr_client_01",
    email: "ana.client@example.com",
    fullName: "Ana Client",
    role: "CLIENT",
    status: "ACTIVE",
    trustScore: 92,
    createdAt: "2026-04-02T09:12:00.000Z",
    activeJobs: ["job_101"],
    disputes: ["dis_1001"]
  },
  {
    id: "usr_freelancer_01",
    email: "maya.freelancer@example.com",
    fullName: "Maya Freelancer",
    role: "FREELANCER",
    status: "ACTIVE",
    trustScore: 87,
    createdAt: "2026-04-08T12:35:00.000Z",
    activeJobs: ["job_101", "job_103"],
    disputes: ["dis_1001"]
  },
  {
    id: "usr_client_02",
    email: "owen.client@example.com",
    fullName: "Owen Client",
    role: "CLIENT",
    status: "SUSPENDED",
    trustScore: 54,
    createdAt: "2026-05-01T17:20:00.000Z",
    activeJobs: ["job_104"],
    disputes: []
  },
  {
    id: "usr_freelancer_02",
    email: "li.freelancer@example.com",
    fullName: "Li Freelancer",
    role: "FREELANCER",
    status: "BANNED",
    trustScore: 22,
    createdAt: "2026-05-12T08:05:00.000Z",
    activeJobs: [],
    disputes: ["dis_1002"]
  },
  {
    id: "usr_admin_01",
    email: "admin@example.com",
    fullName: "Primary Admin",
    role: "ADMIN",
    status: "ACTIVE",
    trustScore: 100,
    createdAt: "2026-03-25T11:00:00.000Z",
    activeJobs: [],
    disputes: []
  }
];

const jobs = [
  {
    id: "job_101",
    title: "Build an AI customer support widget",
    clientId: "usr_client_01",
    clientName: "Ana Client",
    status: "OPEN",
    moderationStatus: "FLAGGED",
    flagReason: "Automated scan detected external payment solicitation",
    reportCount: 3,
    budget: 1500,
    createdAt: "2026-05-10T14:22:00.000Z"
  },
  {
    id: "job_102",
    title: "Design SaaS onboarding flows",
    clientId: "usr_client_01",
    clientName: "Ana Client",
    status: "OPEN",
    moderationStatus: "APPROVED",
    flagReason: null,
    reportCount: 0,
    budget: 900,
    createdAt: "2026-05-11T10:13:00.000Z"
  },
  {
    id: "job_103",
    title: "Migrate legacy API to Node.js",
    clientId: "usr_client_02",
    clientName: "Owen Client",
    status: "IN_PROGRESS",
    moderationStatus: "ESCALATED",
    flagReason: "User report: unclear deliverables and suspicious milestone terms",
    reportCount: 1,
    budget: 2800,
    createdAt: "2026-05-12T15:42:00.000Z"
  },
  {
    id: "job_104",
    title: "Audit smart contract payout flow",
    clientId: "usr_client_02",
    clientName: "Owen Client",
    status: "DRAFT",
    moderationStatus: "FLAGGED",
    flagReason: "High-risk financial wording requires manual review",
    reportCount: 2,
    budget: 4200,
    createdAt: "2026-05-14T07:30:00.000Z"
  }
];

const disputes = [
  {
    id: "dis_1001",
    jobId: "job_101",
    jobTitle: "Build an AI customer support widget",
    clientId: "usr_client_01",
    clientName: "Ana Client",
    freelancerId: "usr_freelancer_01",
    freelancerName: "Maya Freelancer",
    amount: 650,
    status: "open",
    openedAt: "2026-05-13T16:45:00.000Z",
    evidence: ["Milestone brief", "Delivery screenshot", "Chat transcript"],
    thread: [
      { author: "Ana Client", body: "The first milestone is incomplete.", createdAt: "2026-05-13T16:45:00.000Z" },
      { author: "Maya Freelancer", body: "The agreed widget prototype was delivered.", createdAt: "2026-05-13T17:05:00.000Z" }
    ],
    transaction: { paymentId: "pay_445", escrowStatus: "HELD", currency: "USD" },
    ruling: null
  },
  {
    id: "dis_1002",
    jobId: "job_104",
    jobTitle: "Audit smart contract payout flow",
    clientId: "usr_client_02",
    clientName: "Owen Client",
    freelancerId: "usr_freelancer_02",
    freelancerName: "Li Freelancer",
    amount: 1200,
    status: "under_review",
    openedAt: "2026-05-15T09:10:00.000Z",
    evidence: ["Escrow receipt", "Source repository link"],
    thread: [
      { author: "Li Freelancer", body: "Client requested extra work outside the contract.", createdAt: "2026-05-15T09:10:00.000Z" }
    ],
    transaction: { paymentId: "pay_472", escrowStatus: "HELD", currency: "USD" },
    ruling: null
  }
];

const controls = [
  {
    key: "registrationsEnabled",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-15T08:00:00.000Z",
    updatedBy: "usr_admin_01"
  },
  {
    key: "jobPostingsEnabled",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-15T08:00:00.000Z",
    updatedBy: "usr_admin_01"
  }
];

const notifications = [];

const auditLog = [
  {
    id: "aud_001",
    adminId: "usr_admin_01",
    actionType: "CONTROL_UPDATED",
    targetType: "platform_control",
    targetId: "registrationsEnabled",
    message: "Enabled new user registrations",
    createdAt: "2026-05-15T08:00:00.000Z"
  }
];

function now() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
}

function appendAudit({ adminId, actionType, targetType, targetId, message }) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    actionType,
    targetType,
    targetId,
    message,
    createdAt: now()
  };
  auditLog.push(entry);
  return entry;
}

function createNotification(userId, title, body) {
  const notification = {
    id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
    userId,
    title,
    body,
    read: false,
    createdAt: now()
  };
  notifications.push(notification);
  return notification;
}

function requireItem(item, label) {
  if (!item) {
    const error = new Error(`${label} not found`);
    error.status = 404;
    throw error;
  }
  return item;
}

export async function getAdminMetrics() {
  const totalRevenue = jobs.reduce((sum, job) => sum + job.budget, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = jobs.filter((job) => ["FLAGGED", "ESCALATED"].includes(job.moderationStatus)).length;
  const trustScoreDistribution = [
    { label: "0-39", count: users.filter((user) => user.trustScore < 40).length },
    { label: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
    { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];

  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => ["OPEN", "IN_PROGRESS"].includes(job.status)).length,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: totalRevenue,
    trustScoreDistribution,
    refreshedAt: now()
  };
}

export async function listUsers(query) {
  const search = normalize(query.search);
  const role = normalize(query.role);
  const status = normalize(query.status);
  const joinedFrom = query.joinedFrom ? Date.parse(query.joinedFrom) : null;
  const joinedTo = query.joinedTo ? Date.parse(query.joinedTo) : null;

  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      normalize(user.email).includes(search) ||
      normalize(user.fullName).includes(search) ||
      normalize(user.id).includes(search);
    const matchesRole = !role || normalize(user.role) === role;
    const matchesStatus = !status || normalize(user.status) === status;
    const joinedAt = Date.parse(user.createdAt);
    const matchesFrom = !joinedFrom || joinedAt >= joinedFrom;
    const matchesTo = !joinedTo || joinedAt <= joinedTo;

    return matchesSearch && matchesRole && matchesStatus && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}

export async function getUserProfile(userId) {
  const user = requireItem(users.find((candidate) => candidate.id === userId), "User");
  return {
    ...user,
    activeJobs: jobs.filter((job) => user.activeJobs.includes(job.id)),
    disputeHistory: disputes.filter((dispute) => user.disputes.includes(dispute.id))
  };
}

export async function updateUserStatus(adminId, userId, status) {
  const nextStatus = String(status ?? "").toUpperCase();
  if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(nextStatus)) {
    const error = new Error("Invalid user status");
    error.status = 400;
    throw error;
  }

  const user = requireItem(users.find((candidate) => candidate.id === userId), "User");
  user.status = nextStatus;

  appendAudit({
    adminId,
    actionType: `USER_${nextStatus}`,
    targetType: "user",
    targetId: userId,
    message: `Updated ${user.email} to ${nextStatus}`
  });

  return user;
}

export async function listModerationQueue(query) {
  const status = normalize(query.status);
  const flagged = jobs.filter((job) => {
    if (!status) return ["FLAGGED", "ESCALATED"].includes(job.moderationStatus);
    return normalize(job.moderationStatus) === status;
  });

  return paginate(flagged, query);
}

export async function resolveListing(adminId, jobId, action, reason) {
  const job = requireItem(jobs.find((candidate) => candidate.id === jobId), "Job");
  const normalizedAction = normalize(action);
  const statusMap = {
    approve: "APPROVED",
    reject: "REJECTED",
    escalate: "ESCALATED"
  };
  const moderationStatus = statusMap[normalizedAction];

  if (!moderationStatus) {
    const error = new Error("Invalid moderation action");
    error.status = 400;
    throw error;
  }

  job.moderationStatus = moderationStatus;
  job.flagReason = reason || job.flagReason;

  appendAudit({
    adminId,
    actionType: `LISTING_${moderationStatus}`,
    targetType: "job",
    targetId: jobId,
    message: `${moderationStatus} listing ${job.title}${reason ? `: ${reason}` : ""}`
  });

  if (moderationStatus === "REJECTED") {
    createNotification(
      job.clientId,
      "Your listing was rejected",
      reason || `The listing "${job.title}" did not pass moderation.`
    );
  }

  return job;
}

export async function listDisputes(query) {
  const status = normalize(query.status);
  const filtered = status ? disputes.filter((dispute) => normalize(dispute.status) === status) : disputes;
  return paginate(filtered, query);
}

export async function ruleOnDispute(adminId, disputeId, ruling, note) {
  const normalizedRuling = normalize(ruling);
  if (!["client", "freelancer", "refund", "escalate"].includes(normalizedRuling)) {
    const error = new Error("Invalid dispute ruling");
    error.status = 400;
    throw error;
  }

  const dispute = requireItem(disputes.find((candidate) => candidate.id === disputeId), "Dispute");
  dispute.status = normalizedRuling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = {
    ruling: normalizedRuling,
    note,
    adminId,
    ruledAt: now()
  };

  appendAudit({
    adminId,
    actionType: "DISPUTE_RULED",
    targetType: "dispute",
    targetId: disputeId,
    message: `Ruled ${normalizedRuling} on dispute ${disputeId}${note ? `: ${note}` : ""}`
  });

  createNotification(
    dispute.clientId,
    "Dispute updated",
    `A ruling was recorded for ${dispute.jobTitle}: ${normalizedRuling}.`
  );
  createNotification(
    dispute.freelancerId,
    "Dispute updated",
    `A ruling was recorded for ${dispute.jobTitle}: ${normalizedRuling}.`
  );

  return dispute;
}

export async function getPlatformControls() {
  return { controls };
}

export async function updatePlatformControl(adminId, key, enabled) {
  const control = requireItem(controls.find((candidate) => candidate.key === key), "Platform control");
  control.enabled = Boolean(enabled);
  control.updatedAt = now();
  control.updatedBy = adminId;

  appendAudit({
    adminId,
    actionType: "CONTROL_UPDATED",
    targetType: "platform_control",
    targetId: key,
    message: `${control.enabled ? "Enabled" : "Disabled"} ${control.label}`
  });

  return control;
}

export async function listAuditLog(query) {
  const admin = normalize(query.adminId);
  const actionType = normalize(query.actionType);
  const from = query.from ? Date.parse(query.from) : null;
  const to = query.to ? Date.parse(query.to) : null;

  const filtered = auditLog
    .filter((entry) => {
      const createdAt = Date.parse(entry.createdAt);
      const matchesAdmin = !admin || normalize(entry.adminId) === admin;
      const matchesAction = !actionType || normalize(entry.actionType) === actionType;
      const matchesFrom = !from || createdAt >= from;
      const matchesTo = !to || createdAt <= to;
      return matchesAdmin && matchesAction && matchesFrom && matchesTo;
    })
    .slice()
    .reverse();

  return paginate(filtered, query);
}

export async function listNotifications() {
  return { notifications: notifications.slice().reverse() };
}
