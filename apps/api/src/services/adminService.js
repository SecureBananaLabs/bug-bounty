const seedUsers = [
  {
    id: "usr_client_1",
    name: "Amara Li",
    email: "amara@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-03-04T10:20:00.000Z",
    trustScore: 91,
    activeJobs: ["job_101", "job_105"],
    profile: { company: "Northstar Labs", spend: 48200 },
    disputeHistory: ["dsp_201"]
  },
  {
    id: "usr_freelancer_1",
    name: "Miles Ortega",
    email: "miles@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-10T09:15:00.000Z",
    trustScore: 84,
    activeJobs: ["job_101"],
    profile: { skills: ["Next.js", "Payments"], rate: 78 },
    disputeHistory: []
  },
  {
    id: "usr_client_2",
    name: "Priya Raman",
    email: "priya@example.com",
    role: "client",
    status: "under_review",
    joinedAt: "2026-04-18T14:05:00.000Z",
    trustScore: 58,
    activeJobs: ["job_102"],
    profile: { company: "Mosaic Retail", spend: 12600 },
    disputeHistory: ["dsp_202"]
  },
  {
    id: "usr_freelancer_2",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-01-22T17:30:00.000Z",
    trustScore: 37,
    activeJobs: [],
    profile: { skills: ["Copywriting", "SEO"], rate: 42 },
    disputeHistory: ["dsp_202"]
  },
  {
    id: "usr_client_3",
    name: "Hannah Smith",
    email: "hannah@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-03T11:00:00.000Z",
    trustScore: 76,
    activeJobs: ["job_103"],
    profile: { company: "Bright Market", spend: 9400 },
    disputeHistory: []
  },
  {
    id: "usr_freelancer_3",
    name: "Noah Park",
    email: "noah@example.com",
    role: "freelancer",
    status: "banned",
    joinedAt: "2025-12-12T08:45:00.000Z",
    trustScore: 18,
    activeJobs: [],
    profile: { skills: ["Automation"], rate: 61 },
    disputeHistory: ["dsp_203"]
  }
];

const seedJobs = [
  {
    id: "job_101",
    title: "Build a secure billing dashboard",
    posterId: "usr_client_1",
    status: "flagged",
    budget: 6200,
    flaggedBy: "automated_rules",
    reportReason: "Unusual milestone pattern",
    createdAt: "2026-05-11T13:00:00.000Z"
  },
  {
    id: "job_102",
    title: "Scrape private lead database",
    posterId: "usr_client_2",
    status: "flagged",
    budget: 900,
    flaggedBy: "user_report",
    reportReason: "Potential data policy violation",
    createdAt: "2026-05-14T16:30:00.000Z"
  },
  {
    id: "job_103",
    title: "Landing page conversion audit",
    posterId: "usr_client_3",
    status: "open",
    budget: 1800,
    flaggedBy: null,
    reportReason: null,
    createdAt: "2026-05-10T09:10:00.000Z"
  }
];

const seedDisputes = [
  {
    id: "dsp_201",
    status: "open",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    jobId: "job_101",
    amount: 2400,
    openedAt: "2026-05-15T12:00:00.000Z",
    thread: [
      { authorId: "usr_client_1", body: "Milestone two is incomplete.", sentAt: "2026-05-15T12:00:00.000Z" },
      { authorId: "usr_freelancer_1", body: "The deliverable is attached and ready for review.", sentAt: "2026-05-15T12:35:00.000Z" }
    ],
    evidence: ["scope.pdf", "milestone-two.zip"],
    transaction: { id: "txn_301", escrowStatus: "held", refundStatus: "none" }
  },
  {
    id: "dsp_202",
    status: "under_review",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    jobId: "job_102",
    amount: 900,
    openedAt: "2026-05-12T08:25:00.000Z",
    thread: [
      { authorId: "usr_freelancer_2", body: "The client changed scope after delivery.", sentAt: "2026-05-12T08:25:00.000Z" }
    ],
    evidence: ["chat-export.txt"],
    transaction: { id: "txn_302", escrowStatus: "held", refundStatus: "none" }
  }
];

const seedControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const seedAuditLogs = [
  {
    id: "aud_1",
    adminId: "adm_system",
    actionType: "system.seed",
    targetId: "admin-panel",
    details: "Admin panel seed data initialized",
    createdAt: "2026-05-01T00:00:00.000Z"
  }
];

let users;
let jobs;
let disputes;
let controls;
let auditLogs;
let notifications;
let nextAuditId;

export class AdminServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function resetAdminDataForTests() {
  users = structuredClone(seedUsers);
  jobs = structuredClone(seedJobs);
  disputes = structuredClone(seedDisputes);
  controls = structuredClone(seedControls);
  auditLogs = structuredClone(seedAuditLogs);
  notifications = [];
  nextAuditId = 2;
}

resetAdminDataForTests();

function textMatches(value, search) {
  return String(value).toLowerCase().includes(String(search).toLowerCase());
}

function dateMatches(value, from, to) {
  const timestamp = Date.parse(value);
  return (!from || timestamp >= Date.parse(from)) && (!to || timestamp <= Date.parse(to));
}

function paginate(items, query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "5", 10), 1), 25);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function findUser(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new AdminServiceError("User not found", 404);
  }
  return user;
}

function findJob(jobId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) {
    throw new AdminServiceError("Job not found", 404);
  }
  return job;
}

function findDispute(disputeId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new AdminServiceError("Dispute not found", 404);
  }
  return dispute;
}

function appendAuditLog(adminId, actionType, targetId, details) {
  const log = {
    id: `aud_${nextAuditId++}`,
    adminId,
    actionType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };

  auditLogs.unshift(log);
  return log;
}

function notify(userId, type, message) {
  const notification = {
    id: `ntf_${notifications.length + 1}`,
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);
  return notification;
}

function trustDistribution() {
  const ranges = [
    { label: "0-49", min: 0, max: 49 },
    { label: "50-69", min: 50, max: 69 },
    { label: "70-89", min: 70, max: 89 },
    { label: "90-100", min: 90, max: 100 }
  ];

  return ranges.map((range) => ({
    ...range,
    count: users.filter((user) => user.trustScore >= range.min && user.trustScore <= range.max).length
  }));
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "open").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: jobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: jobs.reduce((sum, job) => sum + job.budget, 0),
    trustDistribution: trustDistribution(),
    platformControls: { ...controls },
    refreshedAt: new Date().toISOString()
  };
}

export async function listAdminUsers(query) {
  const filtered = users.filter((user) => {
    const matchesSearch = !query.search || textMatches(`${user.name} ${user.email}`, query.search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesDate = dateMatches(user.joinedAt, query.joinedFrom, query.joinedTo);
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  return paginate(filtered, query);
}

export async function getAdminUser(userId) {
  return findUser(userId);
}

export async function updateUserStatus(userId, payload, adminId) {
  const user = findUser(userId);
  const statusByAction = {
    suspend: "suspended",
    reinstate: "active",
    ban: "banned"
  };
  const nextStatus = statusByAction[payload.action];

  if (!nextStatus) {
    throw new AdminServiceError("Unsupported user action", 422);
  }

  user.status = nextStatus;
  const auditLog = appendAuditLog(adminId, `user.${payload.action}`, userId, payload.reason ?? "No reason provided");

  return { user, auditLog };
}

export async function listModerationJobs(query) {
  const filtered = jobs.filter((job) => {
    const matchesStatus = !query.status || job.status === query.status;
    const matchesSearch = !query.search || textMatches(job.title, query.search);
    return matchesStatus && matchesSearch;
  });

  return paginate(filtered, query);
}

export async function decideModerationJob(jobId, payload, adminId) {
  const job = findJob(jobId);
  const statusByAction = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = statusByAction[payload.action];

  if (!nextStatus) {
    throw new AdminServiceError("Unsupported moderation action", 422);
  }

  job.status = nextStatus;
  job.decisionReason = payload.reason ?? "No reason provided";
  job.reviewedAt = new Date().toISOString();
  job.reviewedBy = adminId;

  const auditLog = appendAuditLog(adminId, `job.${payload.action}`, jobId, job.decisionReason);
  const notification = payload.action === "reject"
    ? notify(job.posterId, "job_rejected", `Your listing was rejected: ${job.decisionReason}`)
    : null;

  return { job, auditLog, notification };
}

export async function listDisputes(query) {
  const filtered = disputes.filter((dispute) => {
    const matchesStatus = !query.status || dispute.status === query.status;
    const matchesSearch = !query.search || textMatches(`${dispute.id} ${dispute.jobId}`, query.search);
    return matchesStatus && matchesSearch;
  });

  return paginate(filtered, query);
}

export async function getDispute(disputeId) {
  return findDispute(disputeId);
}

export async function ruleDispute(disputeId, payload, adminId) {
  const dispute = findDispute(disputeId);
  const supportedRulings = new Set(["client", "freelancer", "refund", "escalate"]);

  if (!supportedRulings.has(payload.resolution)) {
    throw new AdminServiceError("Unsupported dispute ruling", 422);
  }

  dispute.status = payload.resolution === "escalate" ? "under_review" : "resolved";
  dispute.resolution = payload.resolution;
  dispute.resolutionNotes = payload.notes ?? "No notes provided";
  dispute.reviewedAt = new Date().toISOString();
  dispute.reviewedBy = adminId;

  if (payload.resolution === "refund") {
    dispute.transaction.refundStatus = "queued";
  }

  const auditLog = appendAuditLog(adminId, `dispute.${payload.resolution}`, disputeId, dispute.resolutionNotes);
  const parties = [
    notify(dispute.clientId, "dispute_updated", `Dispute ${dispute.id} ruling: ${payload.resolution}`),
    notify(dispute.freelancerId, "dispute_updated", `Dispute ${dispute.id} ruling: ${payload.resolution}`)
  ];

  return { dispute, auditLog, notifications: parties };
}

export async function getPlatformControls() {
  return { ...controls };
}

export async function updatePlatformControl(controlName, payload, adminId) {
  if (!Object.hasOwn(controls, controlName)) {
    throw new AdminServiceError("Platform control not found", 404);
  }

  if (typeof payload.enabled !== "boolean") {
    throw new AdminServiceError("enabled must be a boolean", 422);
  }

  controls[controlName] = payload.enabled;
  const auditLog = appendAuditLog(adminId, `control.${controlName}`, controlName, `Set to ${payload.enabled}`);

  return { controls: { ...controls }, auditLog };
}

export async function listAuditLogs(query) {
  const filtered = auditLogs.filter((log) => {
    const matchesAdmin = !query.adminId || log.adminId === query.adminId;
    const matchesAction = !query.actionType || log.actionType === query.actionType;
    const matchesDate = dateMatches(log.createdAt, query.from, query.to);
    return matchesAdmin && matchesAction && matchesDate;
  });

  return paginate(filtered, query);
}
