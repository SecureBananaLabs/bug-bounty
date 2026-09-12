const users = [
  {
    id: "usr_admin",
    name: "Avery Admin",
    email: "avery.admin@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04T10:00:00.000Z",
    trustScore: 97,
    activeJobs: ["job_101"],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    name: "Nora Client",
    email: "nora.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-11T14:10:00.000Z",
    trustScore: 86,
    activeJobs: ["job_101", "job_204"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Mika Freelancer",
    email: "mika.freelancer@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-08T08:30:00.000Z",
    trustScore: 62,
    activeJobs: ["job_204"],
    disputeHistory: ["dsp_1", "dsp_2"]
  },
  {
    id: "usr_client_2",
    name: "Sol Client",
    email: "sol.client@example.com",
    role: "client",
    status: "banned",
    joinedAt: "2026-04-18T09:45:00.000Z",
    trustScore: 24,
    activeJobs: [],
    disputeHistory: ["dsp_2"]
  }
];

const flaggedJobs = [
  {
    id: "flag_1",
    jobId: "job_101",
    title: "Build payment dashboard",
    clientId: "usr_client_1",
    status: "flagged",
    reason: "Automated rule detected payment-account language",
    reportCount: 2,
    flaggedAt: "2026-05-01T11:00:00.000Z"
  },
  {
    id: "flag_2",
    jobId: "job_204",
    title: "Scrape competitor marketplace",
    clientId: "usr_client_2",
    status: "escalated",
    reason: "User report: possible ToS violation",
    reportCount: 5,
    flaggedAt: "2026-05-04T15:20:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_1",
    jobId: "job_204",
    jobTitle: "Migrate dashboard widgets",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 1800,
    currency: "usd",
    thread: [
      { by: "client", body: "Milestone two is incomplete.", at: "2026-05-05T09:00:00.000Z" },
      { by: "freelancer", body: "The reviewed scope was delivered yesterday.", at: "2026-05-05T10:15:00.000Z" }
    ],
    evidence: ["scope-change.pdf", "handoff-video.mp4"],
    transaction: { escrowId: "esc_204", captured: 900, refundable: 900 }
  },
  {
    id: "dsp_2",
    jobId: "job_310",
    jobTitle: "Landing page copy review",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_1",
    status: "under_review",
    amount: 450,
    currency: "usd",
    thread: [
      { by: "freelancer", body: "Client requested work outside the contract.", at: "2026-05-06T12:00:00.000Z" }
    ],
    evidence: ["original-brief.md", "revision-thread.txt"],
    transaction: { escrowId: "esc_310", captured: 225, refundable: 225 }
  }
];

const platformControls = {
  registrations: { enabled: true, label: "New user registrations" },
  jobPostings: { enabled: true, label: "New job postings" }
};

const notifications = [];
const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin",
    actionType: "seed.loaded",
    targetId: "admin-panel",
    detail: "Initial moderation seed loaded",
    at: "2026-05-01T00:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = flaggedJobs.filter((job) => ["flagged", "escalated"].includes(job.status)).length;

  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs.length, 0),
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { bucket: "0-39", count: users.filter((user) => user.trustScore < 40).length },
      { bucket: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
      { bucket: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { bucket: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ]
  };
}

export async function getUsers(query = {}) {
  const filtered = users
    .filter((user) => matchesSearch(user, query.search))
    .filter((user) => matchesValue(user.role, query.role))
    .filter((user) => matchesValue(user.status, query.status))
    .filter((user) => matchesDate(user.joinedAt, query.joinedFrom, query.joinedTo));

  return paginate(filtered, query);
}

export async function getUser(id) {
  const user = findById(users, id, "User");
  return {
    ...user,
    jobs: user.activeJobs.map((jobId) => ({ id: jobId, title: jobTitle(jobId) })),
    disputes: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function setUserStatus(id, payload, admin) {
  const user = findById(users, id, "User");
  const requestedStatus = payload.status === "reinstate" ? "active" : payload.status;

  if (!["active", "suspended", "banned"].includes(requestedStatus)) {
    throw new Error("Invalid user status");
  }

  user.status = requestedStatus;
  logAction(admin.sub, `user.${requestedStatus}`, id, payload.reason ?? "No reason provided");
  return user;
}

export async function getFlaggedJobs(query = {}) {
  const filtered = flaggedJobs
    .filter((job) => matchesSearch(job, query.search))
    .filter((job) => matchesValue(job.status, query.status));
  return paginate(filtered, query);
}

export async function moderateFlaggedJob(id, payload, admin) {
  const job = findById(flaggedJobs, id, "Flagged job");

  if (!["approve", "reject", "escalate"].includes(payload.action)) {
    throw new Error("Invalid moderation action");
  }

  job.status = payload.action === "approve" ? "approved" : payload.action === "reject" ? "rejected" : "escalated";

  if (payload.action === "reject") {
    notifications.push({
      userId: job.clientId,
      type: "listing_rejected",
      message: payload.reason ?? "Your listing was rejected by moderation.",
      at: new Date().toISOString()
    });
  }

  logAction(admin.sub, `job.${payload.action}`, id, payload.reason ?? "No reason provided");
  return { job, notifications };
}

export async function getDisputes(query = {}) {
  const filtered = disputes
    .filter((dispute) => matchesSearch(dispute, query.search))
    .filter((dispute) => matchesValue(dispute.status, query.status));
  return paginate(filtered, query);
}

export async function getDispute(id) {
  return findById(disputes, id, "Dispute");
}

export async function ruleOnDispute(id, payload, admin) {
  const dispute = findById(disputes, id, "Dispute");

  if (!["client", "freelancer", "refund", "escalate"].includes(payload.ruling)) {
    throw new Error("Invalid dispute ruling");
  }

  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = {
    outcome: payload.ruling,
    reason: payload.reason ?? "No reason provided",
    adminId: admin.sub,
    at: new Date().toISOString()
  };

  notifications.push(
    {
      userId: dispute.clientId,
      type: "dispute_updated",
      message: `Dispute ${dispute.id} ruling: ${payload.ruling}`,
      at: new Date().toISOString()
    },
    {
      userId: dispute.freelancerId,
      type: "dispute_updated",
      message: `Dispute ${dispute.id} ruling: ${payload.ruling}`,
      at: new Date().toISOString()
    }
  );

  logAction(admin.sub, `dispute.${payload.ruling}`, id, payload.reason ?? "No reason provided");
  return dispute;
}

export async function getControls() {
  return platformControls;
}

export async function setControl(key, payload, admin) {
  if (!platformControls[key]) {
    throw new Error("Unknown platform control");
  }

  platformControls[key].enabled = Boolean(payload.enabled);
  logAction(admin.sub, `control.${key}`, key, `Set to ${platformControls[key].enabled}`);
  return platformControls[key];
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog
    .filter((entry) => matchesValue(entry.adminId, query.adminId))
    .filter((entry) => matchesValue(entry.actionType, query.actionType))
    .filter((entry) => matchesDate(entry.at, query.from, query.to));
  return paginate(filtered.toReversed(), query);
}

function paginate(items, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: items.length,
    items: items.slice(offset, offset + pageSize)
  };
}

function matchesSearch(record, search) {
  if (!search) {
    return true;
  }

  return JSON.stringify(record).toLowerCase().includes(String(search).toLowerCase());
}

function matchesValue(actual, expected) {
  return !expected || actual === expected;
}

function matchesDate(value, from, to) {
  const date = new Date(value).getTime();
  return (!from || date >= new Date(from).getTime()) && (!to || date <= new Date(to).getTime());
}

function findById(collection, id, label) {
  const item = collection.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`${label} not found`);
  }
  return item;
}

function jobTitle(jobId) {
  return flaggedJobs.find((job) => job.jobId === jobId)?.title ?? jobId;
}

function logAction(adminId, actionType, targetId, detail) {
  auditLog.push({
    id: `aud_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetId,
    detail,
    at: new Date().toISOString()
  });
}
