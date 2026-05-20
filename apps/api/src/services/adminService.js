const initialUsers = [
  {
    id: "usr_1001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12T10:20:00.000Z",
    trustScore: 94,
    activeJobs: ["job_502"],
    disputeHistory: ["dsp_9002"],
    profile: { location: "Singapore", skills: ["Next.js", "Node.js"], completedJobs: 38 }
  },
  {
    id: "usr_1002",
    name: "Jordan Reed",
    email: "jordan@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-03T15:05:00.000Z",
    trustScore: 81,
    activeJobs: ["job_501", "job_503"],
    disputeHistory: ["dsp_9001"],
    profile: { location: "United States", company: "Northstar Labs", completedJobs: 17 }
  },
  {
    id: "usr_1003",
    name: "Iris Novak",
    email: "iris@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-18T09:30:00.000Z",
    trustScore: 47,
    activeJobs: [],
    disputeHistory: ["dsp_9001"],
    profile: { location: "Germany", skills: ["Security review", "Python"], completedJobs: 4 }
  },
  {
    id: "usr_1004",
    name: "Theo Park",
    email: "theo@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02T12:45:00.000Z",
    trustScore: 72,
    activeJobs: ["job_504"],
    disputeHistory: [],
    profile: { location: "South Korea", company: "Orbit Forge", completedJobs: 9 }
  },
  {
    id: "usr_1005",
    name: "Rina Alvarez",
    email: "rina@example.com",
    role: "freelancer",
    status: "banned",
    joinedAt: "2025-12-04T08:15:00.000Z",
    trustScore: 18,
    activeJobs: [],
    disputeHistory: ["dsp_9003"],
    profile: { location: "Mexico", skills: ["Content", "Data entry"], completedJobs: 2 }
  }
];

const initialJobs = [
  {
    id: "job_501",
    title: "Audit OAuth callback handling",
    clientId: "usr_1002",
    budget: 1200,
    status: "flagged",
    moderationStatus: "pending",
    flagReason: "Automated rule detected off-platform payment wording.",
    reports: 3,
    postedAt: "2026-05-15T10:00:00.000Z"
  },
  {
    id: "job_502",
    title: "Build invoice reconciliation dashboard",
    clientId: "usr_1004",
    budget: 2600,
    status: "active",
    moderationStatus: "approved",
    flagReason: "",
    reports: 0,
    postedAt: "2026-05-10T11:30:00.000Z"
  },
  {
    id: "job_503",
    title: "Scrape private marketplace leads",
    clientId: "usr_1002",
    budget: 850,
    status: "flagged",
    moderationStatus: "escalated",
    flagReason: "User report says the task may violate third-party terms.",
    reports: 2,
    postedAt: "2026-05-17T16:15:00.000Z"
  },
  {
    id: "job_504",
    title: "Create accessible profile settings page",
    clientId: "usr_1004",
    budget: 900,
    status: "active",
    moderationStatus: "approved",
    flagReason: "",
    reports: 0,
    postedAt: "2026-05-18T09:05:00.000Z"
  }
];

const initialDisputes = [
  {
    id: "dsp_9001",
    jobId: "job_501",
    clientId: "usr_1002",
    freelancerId: "usr_1003",
    status: "open",
    amount: 650,
    openedAt: "2026-05-18T06:30:00.000Z",
    transaction: { id: "txn_7001", escrowStatus: "held", currency: "usd" },
    thread: [
      { authorId: "usr_1002", body: "The deliverable missed the agreed OAuth test cases.", createdAt: "2026-05-18T06:35:00.000Z" },
      { authorId: "usr_1003", body: "I uploaded the missing cases in the second archive.", createdAt: "2026-05-18T07:02:00.000Z" }
    ],
    evidence: [
      { id: "ev_1", type: "screenshot", label: "Missing test report" },
      { id: "ev_2", type: "attachment", label: "Second archive manifest" }
    ]
  },
  {
    id: "dsp_9002",
    jobId: "job_502",
    clientId: "usr_1004",
    freelancerId: "usr_1001",
    status: "under_review",
    amount: 300,
    openedAt: "2026-05-19T02:20:00.000Z",
    transaction: { id: "txn_7002", escrowStatus: "held", currency: "usd" },
    thread: [{ authorId: "usr_1001", body: "The scope changed after milestone approval.", createdAt: "2026-05-19T02:24:00.000Z" }],
    evidence: [{ id: "ev_3", type: "message", label: "Milestone approval transcript" }]
  }
];

const initialControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-18T00:00:00.000Z"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedBy: "system",
    updatedAt: "2026-05-18T00:00:00.000Z"
  }
};

let users = structuredClone(initialUsers);
let jobs = structuredClone(initialJobs);
let disputes = structuredClone(initialDisputes);
let controls = structuredClone(initialControls);
let notifications = [];
let auditLog = [
  {
    id: "aud_1",
    adminId: "system",
    action: "admin.bootstrap",
    targetType: "platform",
    targetId: "seed",
    note: "Seeded admin review data",
    createdAt: "2026-05-18T00:00:00.000Z"
  }
];

const VALID_USER_STATUSES = new Set(["active", "suspended", "banned"]);
const VALID_MODERATION_DECISIONS = new Set(["approve", "reject", "escalate"]);
const VALID_DISPUTE_RULINGS = new Set(["freelancer", "client", "refund", "escalate"]);

function clone(value) {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function paginate(items, query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10) || 10, 1), 50);
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: clone(items.slice(start, start + pageSize)),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
}

function matchesDateRange(value, from, to) {
  const timestamp = new Date(value).getTime();
  if (from && timestamp < new Date(from).getTime()) return false;
  if (to && timestamp > new Date(to).getTime()) return false;
  return true;
}

function appendAudit(admin, action, targetType, targetId, note, metadata = {}) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId: admin?.sub ?? admin?.email ?? "unknown_admin",
    action,
    targetType,
    targetId,
    note,
    metadata,
    createdAt: nowIso()
  };
  auditLog.push(entry);
  return clone(entry);
}

function sendNotification(userId, type, message, metadata = {}) {
  const notification = {
    id: `ntf_${notifications.length + 1}`,
    userId,
    type,
    message,
    metadata,
    createdAt: nowIso()
  };
  notifications.push(notification);
  return notification;
}

function trustDistribution() {
  const buckets = [
    { label: "0-49", min: 0, max: 49 },
    { label: "50-69", min: 50, max: 69 },
    { label: "70-89", min: 70, max: 89 },
    { label: "90-100", min: 90, max: 100 }
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: users.filter((user) => user.trustScore >= bucket.min && user.trustScore <= bucket.max).length
  }));
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "active").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: jobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: trustDistribution(),
    generatedAt: nowIso()
  };
}

export async function listUsers(query) {
  const search = query.search?.toLowerCase();
  const filtered = users.filter((user) => {
    if (search && !`${user.name} ${user.email}`.toLowerCase().includes(search)) return false;
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    return matchesDateRange(user.joinedAt, query.joinedFrom, query.joinedTo);
  });

  return paginate(filtered, query);
}

export async function updateUserStatus(userId, payload, admin) {
  if (!VALID_USER_STATUSES.has(payload.status)) {
    return null;
  }

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  const previousStatus = user.status;
  user.status = payload.status;
  user.statusReason = payload.reason ?? "";
  user.updatedAt = nowIso();

  const audit = appendAudit(admin, `user.${payload.status}`, "user", userId, payload.reason ?? "Status updated", {
    previousStatus,
    nextStatus: payload.status
  });

  return { user: clone(user), audit };
}

export async function listFlaggedJobs(query) {
  const filtered = jobs.filter((job) => {
    if (query.status && job.moderationStatus !== query.status) return false;
    if (query.search && !job.title.toLowerCase().includes(query.search.toLowerCase())) return false;
    return true;
  });

  return paginate(filtered, query);
}

export async function decideFlaggedJob(jobId, payload, admin) {
  if (!VALID_MODERATION_DECISIONS.has(payload.decision)) {
    return null;
  }

  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job) return null;

  const previousStatus = job.moderationStatus;
  const nextStatus = payload.decision === "approve" ? "approved" : payload.decision === "reject" ? "rejected" : "escalated";
  job.moderationStatus = nextStatus;
  job.status = nextStatus === "approved" ? "active" : "flagged";
  job.decisionReason = payload.reason ?? "";
  job.reviewedAt = nowIso();

  if (nextStatus === "rejected") {
    sendNotification(job.clientId, "listing_rejected", `Your listing "${job.title}" was rejected.`, {
      jobId,
      reason: payload.reason ?? ""
    });
  }

  const audit = appendAudit(admin, `job.${nextStatus}`, "job", jobId, payload.reason ?? "Listing moderation decision", {
    previousStatus,
    nextStatus
  });

  return { job: clone(job), audit };
}

export async function listDisputes(query) {
  const filtered = disputes.filter((dispute) => {
    if (query.status && dispute.status !== query.status) return false;
    return true;
  });

  return paginate(filtered, query);
}

export async function getDispute(disputeId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  return dispute ? clone(dispute) : null;
}

export async function ruleDispute(disputeId, payload, admin) {
  if (!VALID_DISPUTE_RULINGS.has(payload.ruling)) {
    return null;
  }

  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) return null;

  const previousStatus = dispute.status;
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.resolutionNote = payload.note ?? "";
  dispute.resolvedAt = dispute.status === "resolved" ? nowIso() : undefined;

  const message = payload.ruling === "escalate" ? "Your dispute was escalated for senior review." : `Your dispute was resolved: ${payload.ruling}.`;
  sendNotification(dispute.clientId, "dispute_ruling", message, { disputeId, ruling: payload.ruling });
  sendNotification(dispute.freelancerId, "dispute_ruling", message, { disputeId, ruling: payload.ruling });

  const audit = appendAudit(admin, `dispute.${payload.ruling}`, "dispute", disputeId, payload.note ?? "Dispute ruling recorded", {
    previousStatus,
    nextStatus: dispute.status
  });

  return { dispute: clone(dispute), audit };
}

export async function getPlatformControls() {
  return clone(Object.values(controls));
}

export async function setPlatformControl(controlKey, payload, admin) {
  const control = controls[controlKey];
  if (!control || typeof payload.enabled !== "boolean") {
    return null;
  }

  const previousEnabled = control.enabled;
  control.enabled = payload.enabled;
  control.updatedBy = admin?.sub ?? "unknown_admin";
  control.updatedAt = nowIso();

  const audit = appendAudit(admin, "control.toggle", "control", controlKey, payload.reason ?? "Platform control updated", {
    previousEnabled,
    nextEnabled: payload.enabled
  });

  return { control: clone(control), audit };
}

export async function listAuditLog(query) {
  const filtered = auditLog.filter((entry) => {
    if (query.adminId && entry.adminId !== query.adminId) return false;
    if (query.action && entry.action !== query.action) return false;
    return matchesDateRange(entry.createdAt, query.from, query.to);
  });

  return paginate([...filtered].reverse(), query);
}

export function resetAdminStateForTests() {
  users = structuredClone(initialUsers);
  jobs = structuredClone(initialJobs);
  disputes = structuredClone(initialDisputes);
  controls = structuredClone(initialControls);
  notifications = [];
  auditLog = [
    {
      id: "aud_1",
      adminId: "system",
      action: "admin.bootstrap",
      targetType: "platform",
      targetId: "seed",
      note: "Seeded admin review data",
      createdAt: "2026-05-18T00:00:00.000Z"
    }
  ];
}
