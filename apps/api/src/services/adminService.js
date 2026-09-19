const initialUsers = [
  {
    id: "usr_client_001",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-12",
    trustScore: 91,
    activeJobs: ["job_101", "job_104"],
    disputeIds: ["dsp_300"]
  },
  {
    id: "usr_freelancer_002",
    name: "Noah Price",
    email: "noah@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-03",
    trustScore: 76,
    activeJobs: ["job_102"],
    disputeIds: []
  },
  {
    id: "usr_freelancer_003",
    name: "Amara Singh",
    email: "amara@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-18",
    trustScore: 44,
    activeJobs: [],
    disputeIds: ["dsp_301"]
  },
  {
    id: "usr_client_004",
    name: "Elliot Grant",
    email: "elliot@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-09",
    trustScore: 63,
    activeJobs: ["job_103"],
    disputeIds: []
  }
];

const initialJobs = [
  {
    id: "job_101",
    title: "Landing page rebuild",
    ownerId: "usr_client_001",
    status: "active",
    flagged: true,
    moderationStatus: "pending",
    reportReason: "Automated rules detected suspicious external payment wording.",
    createdAt: "2026-05-02"
  },
  {
    id: "job_102",
    title: "Security copy review",
    ownerId: "usr_client_004",
    status: "active",
    flagged: true,
    moderationStatus: "under_review",
    reportReason: "User report: unclear scope and duplicate listing.",
    createdAt: "2026-05-05"
  },
  {
    id: "job_103",
    title: "Webhook integration",
    ownerId: "usr_client_004",
    status: "active",
    flagged: false,
    moderationStatus: "approved",
    reportReason: "",
    createdAt: "2026-04-30"
  },
  {
    id: "job_104",
    title: "Mobile QA sweep",
    ownerId: "usr_client_001",
    status: "active",
    flagged: false,
    moderationStatus: "approved",
    reportReason: "",
    createdAt: "2026-05-08"
  }
];

const initialDisputes = [
  {
    id: "dsp_300",
    jobId: "job_101",
    clientId: "usr_client_001",
    freelancerId: "usr_freelancer_002",
    status: "open",
    amount: 1250,
    openedAt: "2026-05-10",
    transactionId: "txn_9001",
    thread: [
      { author: "client", message: "Deliverables were uploaded without source files.", at: "2026-05-10T09:15:00Z" },
      { author: "freelancer", message: "Source archive was attached in the second upload.", at: "2026-05-10T10:02:00Z" }
    ],
    evidence: ["contract.pdf", "handoff.zip"]
  },
  {
    id: "dsp_301",
    jobId: "job_102",
    clientId: "usr_client_004",
    freelancerId: "usr_freelancer_003",
    status: "under_review",
    amount: 640,
    openedAt: "2026-05-12",
    transactionId: "txn_9002",
    thread: [
      { author: "freelancer", message: "Milestone requirements changed after approval.", at: "2026-05-12T13:20:00Z" },
      { author: "client", message: "Requested changes were in the original brief.", at: "2026-05-12T14:06:00Z" }
    ],
    evidence: ["brief.md", "revision-log.json"]
  }
];

const initialControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

let users = [];
let jobs = [];
let disputes = [];
let controls = {};
let notifications = [];
let auditLog = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resetState() {
  users = clone(initialUsers);
  jobs = clone(initialJobs);
  disputes = clone(initialDisputes);
  controls = clone(initialControls);
  notifications = [];
  auditLog = [
    {
      id: "aud_001",
      adminId: "system",
      actionType: "system.bootstrap",
      targetId: "admin-panel",
      message: "Admin panel audit log initialized.",
      createdAt: "2026-05-21T00:00:00.000Z"
    }
  ];
}

resetState();

function normalizePage(query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10) || 10, 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = normalizePage(query);
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  };
}

function includes(value, search) {
  return String(value).toLowerCase().includes(search.toLowerCase());
}

function addAudit(adminId, actionType, targetId, message) {
  const entry = {
    id: `aud_${String(auditLog.length + 1).padStart(3, "0")}`,
    adminId,
    actionType,
    targetId,
    message,
    createdAt: new Date().toISOString()
  };

  auditLog.unshift(entry);
  return entry;
}

function requireRecord(record, name) {
  if (!record) {
    const error = new Error(`${name} not found`);
    error.statusCode = 404;
    throw error;
  }

  return record;
}

export async function getAdminOverview() {
  const flaggedListings = jobs.filter((job) => job.flagged && job.moderationStatus !== "approved").length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const revenue = disputes.reduce((total, dispute) => total + dispute.amount, 0);

  return {
    summary: {
      totalUsers: users.length,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue
    },
    trustDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { range: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ],
    controls: clone(controls)
  };
}

export async function listAdminUsers(query) {
  let filtered = users;

  if (query.search) {
    filtered = filtered.filter((user) => includes(user.name, query.search) || includes(user.email, query.search));
  }

  if (query.role) {
    filtered = filtered.filter((user) => user.role === query.role);
  }

  if (query.status) {
    filtered = filtered.filter((user) => user.status === query.status);
  }

  if (query.joinedFrom) {
    filtered = filtered.filter((user) => user.joinedAt >= query.joinedFrom);
  }

  if (query.joinedTo) {
    filtered = filtered.filter((user) => user.joinedAt <= query.joinedTo);
  }

  return paginate(filtered, query);
}

export async function getAdminUserProfile(userId) {
  const user = requireRecord(users.find((item) => item.id === userId), "User");
  const activeJobs = jobs.filter((job) => user.activeJobs.includes(job.id));
  const disputeHistory = disputes.filter((dispute) => user.disputeIds.includes(dispute.id));

  return {
    ...clone(user),
    activeJobs,
    disputeHistory
  };
}

export async function setUserStatus(userId, status, reason, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    const error = new Error("Unsupported user status");
    error.statusCode = 400;
    throw error;
  }

  const user = requireRecord(users.find((item) => item.id === userId), "User");
  user.status = status;

  const audit = addAudit(
    adminId,
    `user.${status}`,
    userId,
    `${user.name} marked ${status}${reason ? `: ${reason}` : "."}`
  );

  return { user: clone(user), audit };
}

export async function listModerationQueue(query) {
  const status = query.status;
  const filtered = jobs.filter((job) => {
    const isModerated = job.flagged || job.moderationStatus !== "approved";
    return isModerated && (!status || job.moderationStatus === status);
  });

  return paginate(filtered, query);
}

export async function moderateListing(jobId, action, reason, adminId) {
  const statusByAction = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = statusByAction[action];

  if (!nextStatus) {
    const error = new Error("Unsupported moderation action");
    error.statusCode = 400;
    throw error;
  }

  const job = requireRecord(jobs.find((item) => item.id === jobId), "Job");
  job.moderationStatus = nextStatus;
  job.flagged = nextStatus !== "approved";

  if (nextStatus === "rejected") {
    notifications.push({
      id: `ntf_${notifications.length + 1}`,
      userId: job.ownerId,
      message: `Listing "${job.title}" was rejected${reason ? `: ${reason}` : "."}`,
      createdAt: new Date().toISOString()
    });
  }

  const audit = addAudit(
    adminId,
    `listing.${nextStatus}`,
    jobId,
    `${job.title} marked ${nextStatus}${reason ? `: ${reason}` : "."}`
  );

  const notification = notifications.at(-1);
  return {
    job: clone(job),
    audit,
    notification: nextStatus === "rejected" ? clone(notification) : null
  };
}

export async function listDisputes(query) {
  const filtered = query.status ? disputes.filter((dispute) => dispute.status === query.status) : disputes;
  return paginate(filtered, query);
}

export async function getDisputeDetail(disputeId) {
  const dispute = requireRecord(disputes.find((item) => item.id === disputeId), "Dispute");
  const client = users.find((user) => user.id === dispute.clientId);
  const freelancer = users.find((user) => user.id === dispute.freelancerId);
  const job = jobs.find((item) => item.id === dispute.jobId);

  return { ...clone(dispute), client, freelancer, job };
}

export async function ruleOnDispute(disputeId, ruling, reason, adminId) {
  if (!["client", "freelancer", "refund", "escalate"].includes(ruling)) {
    const error = new Error("Unsupported dispute ruling");
    error.statusCode = 400;
    throw error;
  }

  const dispute = requireRecord(disputes.find((item) => item.id === disputeId), "Dispute");
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.rulingReason = reason ?? "";

  const firstNotificationId = notifications.length + 1;
  const rulingNotifications = [
    {
      id: `ntf_${firstNotificationId}`,
      userId: dispute.clientId,
      message: `Dispute ${dispute.id} ruling: ${ruling}`,
      createdAt: new Date().toISOString()
    },
    {
      id: `ntf_${firstNotificationId + 1}`,
      userId: dispute.freelancerId,
      message: `Dispute ${dispute.id} ruling: ${ruling}`,
      createdAt: new Date().toISOString()
    }
  ];
  notifications.push(...rulingNotifications);

  const audit = addAudit(
    adminId,
    `dispute.${ruling}`,
    disputeId,
    `Dispute ${disputeId} ruled ${ruling}${reason ? `: ${reason}` : "."}`
  );

  return {
    dispute: clone(dispute),
    audit,
    notifications: clone(rulingNotifications)
  };
}

export async function getPlatformControls() {
  return clone(controls);
}

export async function updatePlatformControl(key, enabled, adminId) {
  if (!["registrationsEnabled", "jobPostingEnabled"].includes(key)) {
    const error = new Error("Unsupported platform control");
    error.statusCode = 400;
    throw error;
  }

  controls[key] = Boolean(enabled);
  const audit = addAudit(adminId, "platform.control", key, `${key} set to ${controls[key] ? "enabled" : "disabled"}.`);

  return { controls: clone(controls), audit };
}

export async function listAuditLog(query) {
  let filtered = auditLog;

  if (query.adminId) {
    filtered = filtered.filter((entry) => entry.adminId === query.adminId);
  }

  if (query.actionType) {
    filtered = filtered.filter((entry) => entry.actionType === query.actionType);
  }

  if (query.from) {
    filtered = filtered.filter((entry) => entry.createdAt >= query.from);
  }

  if (query.to) {
    filtered = filtered.filter((entry) => entry.createdAt <= query.to);
  }

  return paginate(filtered, query);
}

export function _resetAdminStateForTests() {
  resetState();
}
