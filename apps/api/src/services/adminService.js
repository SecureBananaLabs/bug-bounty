const users = [
  {
    id: "usr_client_1",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-14T10:00:00.000Z",
    trustScore: 92,
    activeJobs: ["job_101"],
    disputes: ["dsp_301"]
  },
  {
    id: "usr_freelancer_1",
    name: "Jordan Ortiz",
    email: "jordan@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-03T12:20:00.000Z",
    trustScore: 84,
    activeJobs: ["job_101", "job_108"],
    disputes: []
  },
  {
    id: "usr_client_2",
    name: "Ari Patel",
    email: "ari@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-22T09:40:00.000Z",
    trustScore: 48,
    activeJobs: [],
    disputes: ["dsp_302"]
  },
  {
    id: "usr_freelancer_2",
    name: "Lena Ruiz",
    email: "lena@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-10T14:05:00.000Z",
    trustScore: 76,
    activeJobs: ["job_109"],
    disputes: []
  }
];

const moderationQueue = [
  {
    id: "mod_201",
    jobId: "job_108",
    title: "Urgent crypto wallet recovery",
    reporter: "automated-risk",
    reason: "High-risk payment language",
    status: "flagged",
    ownerId: "usr_client_1",
    flaggedAt: "2026-05-18T11:10:00.000Z"
  },
  {
    id: "mod_202",
    jobId: "job_109",
    title: "Scrape gated marketplace data",
    reporter: "usr_freelancer_1",
    reason: "Possible terms-of-service violation",
    status: "under_review",
    ownerId: "usr_client_2",
    flaggedAt: "2026-05-20T15:25:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_301",
    jobId: "job_101",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    amount: 1500,
    status: "open",
    openedAt: "2026-05-21T16:45:00.000Z",
    thread: ["Client requested another revision.", "Freelancer attached delivery notes."],
    evidence: ["delivery-log.pdf", "scope-agreement.md"]
  },
  {
    id: "dsp_302",
    jobId: "job_099",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    amount: 640,
    status: "under_review",
    openedAt: "2026-05-19T08:30:00.000Z",
    thread: ["Milestone was funded.", "Final archive is missing source files."],
    evidence: ["milestone-receipt.png"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true,
  updatedAt: "2026-05-20T00:00:00.000Z"
};

const notifications = [];
const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin_seed",
    action: "controls.viewed",
    targetId: "platform",
    detail: "Initial admin panel seed data loaded",
    createdAt: "2026-05-20T00:00:00.000Z"
  }
];

function pageNumber(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function paginate(records, query = {}) {
  const page = pageNumber(query.page, 1);
  const pageSize = Math.min(pageNumber(query.pageSize, 10), 50);
  const start = (page - 1) * pageSize;

  return {
    items: records.slice(start, start + pageSize),
    page,
    pageSize,
    total: records.length,
    totalPages: Math.max(1, Math.ceil(records.length / pageSize))
  };
}

function recordAudit(adminId, action, targetId, detail) {
  const event = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    action,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };
  auditLog.push(event);
  return event;
}

function notify(userId, message) {
  notifications.push({
    id: `ntf_admin_${notifications.length + 1}`,
    userId,
    message,
    createdAt: new Date().toISOString()
  });
}

function findById(records, id, label) {
  const record = records.find((item) => item.id === id);
  if (!record) {
    const error = new Error(`${label} not found`);
    error.status = 404;
    throw error;
  }
  return record;
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationQueue.filter((item) => item.status !== "approved").length;
  const activeJobs = users.reduce((total, user) => total + user.activeJobs.length, 0);

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { bucket: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { bucket: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { bucket: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ],
    lastUpdated: new Date().toISOString()
  };
}

export async function listUsers(query = {}) {
  const search = String(query.search ?? "").toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const joined = new Date(user.joinedAt).getTime();
    const matchesFrom = !query.joinedFrom || joined >= new Date(query.joinedFrom).getTime();
    const matchesTo = !query.joinedTo || joined <= new Date(query.joinedTo).getTime();
    return matchesSearch && matchesRole && matchesStatus && matchesFrom && matchesTo;
  });

  return paginate(filtered, query);
}

export async function getUserProfile(id) {
  const user = findById(users, id, "User");
  return {
    ...user,
    disputeHistory: disputes.filter((dispute) => dispute.clientId === id || dispute.freelancerId === id)
  };
}

export async function updateUserStatus(id, payload = {}, adminId = "unknown_admin") {
  const user = findById(users, id, "User");
  const nextStatus = payload.status;
  if (!["active", "suspended", "banned"].includes(nextStatus)) {
    const error = new Error("Invalid user status");
    error.status = 400;
    throw error;
  }

  user.status = nextStatus;
  const audit = recordAudit(adminId, `user.${nextStatus}`, id, payload.reason ?? `User marked ${nextStatus}`);
  notify(id, `Your account status was updated to ${nextStatus}.`);
  return { user, audit };
}

export async function listModerationQueue(query = {}) {
  const filtered = moderationQueue.filter((item) => !query.status || item.status === query.status);
  return paginate(filtered, query);
}

export async function moderateListing(id, payload = {}, adminId = "unknown_admin") {
  const listing = findById(moderationQueue, id, "Moderation item");
  const action = payload.action;
  if (!["approve", "reject", "escalate"].includes(action)) {
    const error = new Error("Invalid moderation action");
    error.status = 400;
    throw error;
  }

  listing.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  const audit = recordAudit(adminId, `listing.${listing.status}`, id, payload.reason ?? `Listing ${listing.status}`);
  if (listing.status === "rejected") {
    notify(listing.ownerId, `Your listing was rejected: ${payload.reason ?? "No reason provided"}`);
  }

  return { listing, audit };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function resolveDispute(id, payload = {}, adminId = "unknown_admin") {
  const dispute = findById(disputes, id, "Dispute");
  const ruling = payload.ruling;
  if (!["client", "freelancer", "refund", "escalate"].includes(ruling)) {
    const error = new Error("Invalid dispute ruling");
    error.status = 400;
    throw error;
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.resolvedAt = dispute.status === "resolved" ? new Date().toISOString() : undefined;

  const audit = recordAudit(adminId, `dispute.${ruling}`, id, payload.reason ?? `Dispute ruling: ${ruling}`);
  notify(dispute.clientId, `Dispute ${id} was updated with ruling: ${ruling}.`);
  notify(dispute.freelancerId, `Dispute ${id} was updated with ruling: ${ruling}.`);
  return { dispute, audit };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControls(payload = {}, adminId = "unknown_admin") {
  const updates = {};
  if (typeof payload.registrationsEnabled === "boolean") {
    updates.registrationsEnabled = payload.registrationsEnabled;
  }
  if (typeof payload.jobPostingEnabled === "boolean") {
    updates.jobPostingEnabled = payload.jobPostingEnabled;
  }

  Object.assign(platformControls, updates, { updatedAt: new Date().toISOString() });
  const changed = Object.keys(updates).join(", ") || "none";
  const audit = recordAudit(adminId, "controls.updated", "platform", `Updated controls: ${changed}`);
  return { controls: platformControls, audit };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((event) => {
    const created = new Date(event.createdAt).getTime();
    const matchesAdmin = !query.adminId || event.adminId === query.adminId;
    const matchesAction = !query.action || event.action.includes(query.action);
    const matchesFrom = !query.from || created >= new Date(query.from).getTime();
    const matchesTo = !query.to || created <= new Date(query.to).getTime();
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });

  return paginate([...filtered].reverse(), query);
}
