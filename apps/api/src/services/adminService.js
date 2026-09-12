const users = [
  {
    id: "usr_client_1",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02T10:00:00.000Z",
    trustScore: 92,
    activeJobs: ["job_1"],
    disputes: ["disp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Noah Patel",
    email: "noah@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-07T10:00:00.000Z",
    trustScore: 84,
    activeJobs: ["job_1"],
    disputes: ["disp_1"]
  },
  {
    id: "usr_freelancer_2",
    name: "Ari Gomez",
    email: "ari@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-04-16T10:00:00.000Z",
    trustScore: 41,
    activeJobs: [],
    disputes: []
  }
];

const jobs = [
  {
    id: "job_1",
    title: "Build escrow landing page",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "active",
    flagged: false,
    reports: 0,
    revenue: 1250
  },
  {
    id: "job_2",
    title: "Suspicious lead scraping bot",
    clientId: "usr_client_1",
    freelancerId: null,
    status: "flagged",
    flagged: true,
    reports: 3,
    flagReason: "Automated moderation flagged prohibited scraping language",
    revenue: 0
  }
];

const disputes = [
  {
    id: "disp_1",
    jobId: "job_1",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 1250,
    thread: [
      { authorId: "usr_client_1", body: "Deliverable is incomplete.", at: "2026-05-01T09:10:00.000Z" },
      { authorId: "usr_freelancer_1", body: "Latest revision includes the requested pages.", at: "2026-05-01T10:25:00.000Z" }
    ],
    evidence: [{ label: "Revision link", url: "https://example.com/revision" }],
    transaction: { escrowId: "esc_1001", paymentId: "pay_1001", status: "held" }
  }
];

const platformControls = {
  registrations: { enabled: true, label: "New user registrations" },
  jobPostings: { enabled: true, label: "New job postings" }
};

const auditEntries = [];
const notifications = [];

function addAudit(adminId, action, targetType, targetId, details = {}) {
  const entry = {
    id: `audit_${auditEntries.length + 1}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditEntries.unshift(entry);
  return entry;
}

function notify(userId, type, message) {
  notifications.push({
    id: `ntf_${notifications.length + 1}`,
    userId,
    type,
    message,
    createdAt: new Date().toISOString()
  });
}

function paginate(items, query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? "10", 10), 1), 50);
  const total = items.length;
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  };
}

function requireReason(reason) {
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    const error = new Error("A reason is required for this admin action");
    error.statusCode = 400;
    throw error;
  }
}

export async function getAdminMetrics() {
  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const flaggedListings = jobs.filter((job) => job.flagged || job.status === "flagged").length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const revenue = jobs.reduce((sum, job) => sum + (job.revenue ?? 0), 0);
  const trustScoreBuckets = {
    low: users.filter((user) => user.trustScore < 50).length,
    medium: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
    high: users.filter((user) => user.trustScore >= 80).length
  };

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenue,
    trustScoreBuckets
  };
}

export async function listAdminUsers(query = {}) {
  let filtered = [...users];
  if (query.role) {
    filtered = filtered.filter((user) => user.role === query.role);
  }
  if (query.status) {
    filtered = filtered.filter((user) => user.status === query.status);
  }
  if (query.search) {
    const term = query.search.toLowerCase();
    filtered = filtered.filter((user) =>
      [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(term))
    );
  }
  if (query.joinedAfter) {
    filtered = filtered.filter((user) => new Date(user.joinedAt) >= new Date(query.joinedAfter));
  }

  return paginate(filtered, query);
}

export async function getAdminUser(id) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    ...user,
    jobs: jobs.filter((job) => job.clientId === id || job.freelancerId === id),
    disputeHistory: disputes.filter((dispute) => dispute.clientId === id || dispute.freelancerId === id)
  };
}

export async function setUserStatus(id, status, reason, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    const error = new Error("Status must be active, suspended, or banned");
    error.statusCode = 400;
    throw error;
  }
  requireReason(reason);

  const user = await getAdminUser(id);
  const baseUser = users.find((candidate) => candidate.id === id);
  baseUser.status = status;
  addAudit(adminId, `user.${status}`, "user", id, { reason });
  notify(id, `account.${status}`, `Your account status changed to ${status}: ${reason}`);

  return { ...user, status };
}

export async function listModerationJobs(query = {}) {
  const filtered = jobs.filter((job) => job.flagged || job.status === "flagged");
  return paginate(filtered, query);
}

export async function moderateJob(id, action, reason, adminId) {
  if (!["approve", "reject", "escalate"].includes(action)) {
    const error = new Error("Action must be approve, reject, or escalate");
    error.statusCode = 400;
    throw error;
  }
  requireReason(reason);

  const job = jobs.find((candidate) => candidate.id === id);
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  if (action === "approve") {
    job.status = "open";
    job.flagged = false;
  } else if (action === "reject") {
    job.status = "rejected";
    job.flagged = false;
    notify(job.clientId, "job.rejected", `Your listing was rejected: ${reason}`);
  } else {
    job.status = "escalated";
  }

  addAudit(adminId, `job.${action}`, "job", id, { reason });
  return job;
}

export async function listDisputes(query = {}) {
  let filtered = [...disputes];
  if (query.status) {
    filtered = filtered.filter((dispute) => dispute.status === query.status);
  }
  return paginate(filtered, query);
}

export async function getDispute(id) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) {
    const error = new Error("Dispute not found");
    error.statusCode = 404;
    throw error;
  }
  return dispute;
}

export async function applyDisputeRuling(id, ruling, reason, adminId) {
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    const error = new Error("Ruling must be client, freelancer, or escalate");
    error.statusCode = 400;
    throw error;
  }
  requireReason(reason);

  const dispute = await getDispute(id);
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolutionReason = reason;
  addAudit(adminId, `dispute.${ruling}`, "dispute", id, { reason });
  notify(dispute.clientId, "dispute.updated", `Dispute ${id} ruling: ${ruling}`);
  notify(dispute.freelancerId, "dispute.updated", `Dispute ${id} ruling: ${ruling}`);
  return dispute;
}

export async function getPlatformControls() {
  return platformControls;
}

export async function setPlatformControl(key, enabled, reason, adminId) {
  if (!Object.prototype.hasOwnProperty.call(platformControls, key)) {
    const error = new Error("Unknown platform control");
    error.statusCode = 404;
    throw error;
  }
  if (typeof enabled !== "boolean") {
    const error = new Error("Control enabled value must be boolean");
    error.statusCode = 400;
    throw error;
  }
  requireReason(reason);

  platformControls[key].enabled = enabled;
  addAudit(adminId, "platform.control.updated", "platformControl", key, { enabled, reason });
  return platformControls[key];
}

export async function listAuditLog(query = {}) {
  let filtered = [...auditEntries];
  if (query.adminId) {
    filtered = filtered.filter((entry) => entry.adminId === query.adminId);
  }
  if (query.action) {
    filtered = filtered.filter((entry) => entry.action === query.action);
  }
  if (query.from) {
    filtered = filtered.filter((entry) => new Date(entry.createdAt) >= new Date(query.from));
  }
  if (query.to) {
    filtered = filtered.filter((entry) => new Date(entry.createdAt) <= new Date(query.to));
  }
  return paginate(filtered, query);
}
