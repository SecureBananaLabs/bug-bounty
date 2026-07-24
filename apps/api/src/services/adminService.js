export class AdminServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
  }
}

const users = [
  {
    id: "usr_101",
    name: "Maya Stone",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-14",
    trustScore: 94,
    profile: { headline: "Full-stack marketplace engineer", location: "Austin, TX" },
    activeJobIds: ["job_401"],
    disputeIds: ["dsp_901"]
  },
  {
    id: "usr_102",
    name: "Jordan Reed",
    role: "client",
    status: "active",
    joinedAt: "2026-02-05",
    trustScore: 82,
    profile: { headline: "Operations lead", location: "Denver, CO" },
    activeJobIds: ["job_402"],
    disputeIds: []
  },
  {
    id: "usr_103",
    name: "Priya Shah",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-02-22",
    trustScore: 57,
    profile: { headline: "Data automation specialist", location: "Raleigh, NC" },
    activeJobIds: [],
    disputeIds: ["dsp_902"]
  },
  {
    id: "usr_104",
    name: "Owen Lee",
    role: "client",
    status: "active",
    joinedAt: "2026-03-03",
    trustScore: 76,
    profile: { headline: "Product founder", location: "Seattle, WA" },
    activeJobIds: ["job_403"],
    disputeIds: ["dsp_902"]
  },
  {
    id: "usr_105",
    name: "Sam Rivera",
    role: "freelancer",
    status: "banned",
    joinedAt: "2026-03-19",
    trustScore: 21,
    profile: { headline: "Growth copywriter", location: "Miami, FL" },
    activeJobIds: [],
    disputeIds: []
  }
];

const jobs = [
  {
    id: "job_401",
    title: "Build escrow release workflow",
    posterId: "usr_102",
    status: "active",
    budgetCents: 320000,
    flagged: false,
    reports: []
  },
  {
    id: "job_402",
    title: "Scrape private contact database",
    posterId: "usr_102",
    status: "flagged",
    budgetCents: 90000,
    flagged: true,
    flagReason: "Automated policy rule: prohibited data source",
    reports: ["Contains private contact data request", "Possible ToS violation"]
  },
  {
    id: "job_403",
    title: "Landing page refresh",
    posterId: "usr_104",
    status: "flagged",
    budgetCents: 140000,
    flagged: true,
    flagReason: "User report: misleading payment terms",
    reports: ["Milestone terms conflict with platform escrow policy"]
  }
];

const disputes = [
  {
    id: "dsp_901",
    freelancerId: "usr_101",
    clientId: "usr_102",
    jobId: "job_401",
    status: "open",
    amountCents: 120000,
    thread: [
      { author: "client", message: "Deliverable missed webhook retries." },
      { author: "freelancer", message: "Retries are implemented; logs attached." }
    ],
    evidence: ["deploy-log.txt", "webhook-test-result.png"],
    transaction: { id: "txn_501", escrowStatus: "held", paymentIntentId: "pi_admin_demo_501" }
  },
  {
    id: "dsp_902",
    freelancerId: "usr_103",
    clientId: "usr_104",
    jobId: "job_403",
    status: "under_review",
    amountCents: 65000,
    thread: [
      { author: "freelancer", message: "Scope changed after milestone approval." },
      { author: "client", message: "Final asset did not match agreed copy." }
    ],
    evidence: ["milestone-approval.pdf", "final-copy.md"],
    transaction: { id: "txn_502", escrowStatus: "held", paymentIntentId: "pi_admin_demo_502" }
  }
];

const notifications = [];
const auditLog = [
  {
    id: "aud_001",
    adminId: "system",
    action: "platform.review_started",
    targetType: "platform",
    targetId: "admin",
    reason: "Initial admin queue loaded",
    createdAt: "2026-05-20T14:15:00.000Z"
  }
];
const platformControls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-05-20T14:15:00.000Z",
    updatedBy: "system"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-05-20T14:15:00.000Z",
    updatedBy: "system"
  }
};

function getAdminId(adminUser) {
  return adminUser?.sub ?? adminUser?.id ?? "unknown-admin";
}

function recordAudit(adminUser, action, targetType, targetId, reason = "") {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId: getAdminId(adminUser),
    action,
    targetType,
    targetId,
    reason,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);
  return entry;
}

function notify(userId, type, message) {
  notifications.unshift({
    id: `ntf_${String(notifications.length + 1).padStart(3, "0")}`,
    userId,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false
  });
}

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages
  };
}

function findUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new AdminServiceError("User not found", 404);
  }
  return user;
}

function findJob(jobId) {
  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job) {
    throw new AdminServiceError("Job not found", 404);
  }
  return job;
}

function findDispute(disputeId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    throw new AdminServiceError("Dispute not found", 404);
  }
  return dispute;
}

function trustDistribution() {
  const buckets = [
    { range: "0-39", count: 0 },
    { range: "40-69", count: 0 },
    { range: "70-89", count: 0 },
    { range: "90-100", count: 0 }
  ];

  for (const user of users) {
    if (user.trustScore < 40) buckets[0].count += 1;
    else if (user.trustScore < 70) buckets[1].count += 1;
    else if (user.trustScore < 90) buckets[2].count += 1;
    else buckets[3].count += 1;
  }

  return buckets;
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "active").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: jobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: trustDistribution()
  };
}

export async function listUsers(query = {}) {
  const search = String(query.search ?? "").trim().toLowerCase();
  const role = query.role ? String(query.role) : "";
  const status = query.status ? String(query.status) : "";
  const joinedAfter = query.joinedAfter ? new Date(String(query.joinedAfter)) : null;
  const joinedBefore = query.joinedBefore ? new Date(String(query.joinedBefore)) : null;

  const filtered = users.filter((user) => {
    const joinedAt = new Date(user.joinedAt);
    return (
      (!search || `${user.name} ${user.id}`.toLowerCase().includes(search)) &&
      (!role || user.role === role) &&
      (!status || user.status === status) &&
      (!joinedAfter || joinedAt >= joinedAfter) &&
      (!joinedBefore || joinedAt <= joinedBefore)
    );
  });

  return paginate(filtered, query);
}

export async function getUserProfile(userId) {
  const user = findUser(userId);
  return {
    ...user,
    activeJobs: jobs.filter((job) => user.activeJobIds.includes(job.id)),
    disputeHistory: disputes.filter((dispute) => user.disputeIds.includes(dispute.id))
  };
}

export async function updateUserStatus(userId, status, adminUser, reason = "") {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new AdminServiceError("Status must be active, suspended, or banned");
  }

  const user = findUser(userId);
  user.status = status;
  const audit = recordAudit(adminUser, "user.status_changed", "user", userId, reason || `Status set to ${status}`);
  notify(userId, "account_status", `Your account status changed to ${status}.`);

  return { user, audit };
}

export async function listFlaggedListings(query = {}) {
  return paginate(
    jobs
      .filter((job) => ["flagged", "escalated"].includes(job.status))
      .map((job) => ({
        ...job,
        poster: findUser(job.posterId)
      })),
    query
  );
}

export async function moderateListing(jobId, decision, adminUser, reason = "") {
  if (!["approve", "reject", "escalate"].includes(decision)) {
    throw new AdminServiceError("Decision must be approve, reject, or escalate");
  }

  const job = findJob(jobId);
  const nextStatus = decision === "approve" ? "active" : decision === "reject" ? "rejected" : "escalated";
  job.status = nextStatus;
  job.flagged = nextStatus === "escalated";

  if (decision === "reject") {
    notify(job.posterId, "listing_rejected", reason || "Your listing was rejected by platform moderation.");
  }

  const audit = recordAudit(adminUser, `listing.${decision}`, "job", jobId, reason);
  return { job, audit };
}

export async function listDisputes(query = {}) {
  const status = query.status ? String(query.status) : "";
  const filtered = disputes.filter((dispute) => !status || dispute.status === status);

  return paginate(
    filtered.map((dispute) => ({
      ...dispute,
      freelancer: findUser(dispute.freelancerId),
      client: findUser(dispute.clientId),
      job: findJob(dispute.jobId)
    })),
    query
  );
}

export async function getDisputeDetail(disputeId) {
  const dispute = findDispute(disputeId);
  return {
    ...dispute,
    freelancer: findUser(dispute.freelancerId),
    client: findUser(dispute.clientId),
    job: findJob(dispute.jobId)
  };
}

export async function ruleDispute(disputeId, ruling, adminUser, reason = "") {
  if (!["freelancer", "client", "refund", "escalate"].includes(ruling)) {
    throw new AdminServiceError("Ruling must be freelancer, client, refund, or escalate");
  }

  const dispute = findDispute(disputeId);
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionReason = reason;

  notify(dispute.freelancerId, "dispute_ruling", `Dispute ${dispute.id} ruling: ${ruling}.`);
  notify(dispute.clientId, "dispute_ruling", `Dispute ${dispute.id} ruling: ${ruling}.`);

  const audit = recordAudit(adminUser, "dispute.ruled", "dispute", disputeId, reason || ruling);
  return { dispute, audit };
}

export async function getPlatformControls() {
  return Object.values(platformControls);
}

export async function updatePlatformControl(key, enabled, confirmation, adminUser) {
  const control = platformControls[key];
  if (!control) {
    throw new AdminServiceError("Platform control not found", 404);
  }
  if (confirmation !== true) {
    throw new AdminServiceError("Confirmation is required before changing platform controls");
  }

  control.enabled = Boolean(enabled);
  control.updatedAt = new Date().toISOString();
  control.updatedBy = getAdminId(adminUser);

  const audit = recordAudit(adminUser, "platform_control.updated", "platform_control", key, `${control.label}: ${control.enabled}`);
  return { control, audit };
}

export async function listAuditLog(query = {}) {
  const adminId = query.adminId ? String(query.adminId) : "";
  const action = query.action ? String(query.action) : "";
  const start = query.start ? new Date(String(query.start)) : null;
  const end = query.end ? new Date(String(query.end)) : null;

  const filtered = auditLog.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return (
      (!adminId || entry.adminId === adminId) &&
      (!action || entry.action === action) &&
      (!start || createdAt >= start) &&
      (!end || createdAt <= end)
    );
  });

  return paginate(filtered, query);
}
