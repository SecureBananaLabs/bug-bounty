const users = [
  {
    id: "usr_client_1",
    name: "Avery Tan",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-14T09:15:00.000Z",
    trustScore: 92,
    activeJobs: ["job_101"],
    disputes: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Dev",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-02T11:30:00.000Z",
    trustScore: 86,
    activeJobs: ["job_101", "job_102"],
    disputes: []
  },
  {
    id: "usr_client_2",
    name: "Jordan Lee",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18T15:45:00.000Z",
    trustScore: 54,
    activeJobs: [],
    disputes: ["dsp_2"]
  },
  {
    id: "usr_freelancer_2",
    name: "Sam Rivera",
    email: "sam@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-08T08:05:00.000Z",
    trustScore: 73,
    activeJobs: ["job_103"],
    disputes: []
  }
];

const flaggedJobs = [
  {
    id: "job_101",
    title: "AI support widget",
    clientId: "usr_client_1",
    budget: 150000,
    status: "flagged",
    reason: "Automated budget and scope mismatch",
    reportedAt: "2026-05-27T06:00:00.000Z"
  },
  {
    id: "job_104",
    title: "Urgent payment recovery",
    clientId: "usr_client_2",
    budget: 45000,
    status: "escalated",
    reason: "Multiple user reports",
    reportedAt: "2026-05-30T18:20:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_1",
    jobId: "job_101",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    status: "open",
    amount: 70000,
    thread: [
      { author: "client", message: "Milestone copy is incomplete." },
      { author: "freelancer", message: "Latest build includes the requested flow." }
    ],
    evidence: ["handoff-notes.md", "build-screenshot.png"]
  },
  {
    id: "dsp_2",
    jobId: "job_104",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_2",
    status: "under_review",
    amount: 32000,
    thread: [{ author: "freelancer", message: "Client changed scope after delivery." }],
    evidence: ["scope-change.pdf"]
  }
];

const notifications = [];

const controls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin_seed",
    actionType: "system.bootstrap",
    targetId: "admin-panel",
    createdAt: "2026-05-17T05:53:20.000Z",
    details: "Initial admin panel seed state"
  }
];

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function audit(adminId, actionType, targetId, details) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetId,
    createdAt: new Date().toISOString(),
    details
  };
  auditLog.push(entry);
  return entry;
}

function notify(userId, message) {
  notifications.push({
    id: `ntf_admin_${notifications.length + 1}`,
    userId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
}

function findUser(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
  return user;
}

function findFlaggedJob(jobId) {
  const job = flaggedJobs.find((item) => item.id === jobId);
  if (!job) {
    throw Object.assign(new Error("Flagged listing not found"), { statusCode: 404 });
  }
  return job;
}

function findDispute(disputeId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });
  }
  return dispute;
}

function ensureAllowed(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw Object.assign(new Error(`${label} must be one of: ${allowed.join(", ")}`), { statusCode: 400 });
  }
}

function trustDistribution() {
  return [
    { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { range: "50-74", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 75).length },
    { range: "75-100", count: users.filter((user) => user.trustScore >= 75).length }
  ];
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs.length, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status !== "approved").length,
    currentPeriodRevenue: 128900,
    trustDistribution: trustDistribution()
  };
}

export async function listAdminUsers(query) {
  const filtered = users.filter((user) => {
    const matchesSearch = query.search
      ? `${user.name} ${user.email}`.toLowerCase().includes(String(query.search).toLowerCase())
      : true;
    const matchesRole = query.role ? user.role === query.role : true;
    const matchesStatus = query.status ? user.status === query.status : true;
    const joinedAt = new Date(user.joinedAt).getTime();
    const joinedFrom = query.joinedFrom ? new Date(query.joinedFrom).getTime() : null;
    const joinedTo = query.joinedTo ? new Date(query.joinedTo).getTime() : null;

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      (joinedFrom ? joinedAt >= joinedFrom : true) &&
      (joinedTo ? joinedAt <= joinedTo : true)
    );
  });

  return paginate(filtered, query);
}

export async function getAdminUser(userId) {
  const user = findUser(userId);
  return {
    ...user,
    activeJobs: user.activeJobs.map((jobId) => flaggedJobs.find((job) => job.id === jobId) ?? { id: jobId }),
    disputeHistory: disputes.filter((dispute) => dispute.clientId === userId || dispute.freelancerId === userId)
  };
}

export async function updateUserStatus(userId, status, adminId) {
  ensureAllowed(status, ["active", "suspended", "banned"], "status");
  const user = findUser(userId);
  user.status = status;
  audit(adminId, `user.${status}`, userId, `${user.email} marked ${status}`);
  return user;
}

export async function listModerationQueue(query) {
  const filtered = flaggedJobs.filter((job) => {
    const matchesStatus = query.status ? job.status === query.status : true;
    const matchesSearch = query.search ? job.title.toLowerCase().includes(String(query.search).toLowerCase()) : true;
    return matchesStatus && matchesSearch;
  });
  return paginate(filtered, query);
}

export async function moderateListing(jobId, action, reason, adminId) {
  ensureAllowed(action, ["approve", "reject", "escalate"], "action");
  const job = findFlaggedJob(jobId);
  job.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  job.resolutionReason = reason ?? "";
  audit(adminId, `listing.${action}`, jobId, reason ?? `Listing ${action}d`);

  if (action === "reject") {
    notify(job.clientId, `Your listing "${job.title}" was rejected: ${reason ?? "No reason provided"}`);
  }

  return job;
}

export async function listDisputes(query) {
  const filtered = disputes.filter((dispute) => (query.status ? dispute.status === query.status : true));
  return paginate(filtered, query);
}

export async function getDispute(disputeId) {
  return findDispute(disputeId);
}

export async function ruleOnDispute(disputeId, ruling, adminId) {
  ensureAllowed(ruling, ["client", "freelancer", "refund", "escalate"], "ruling");
  const dispute = findDispute(disputeId);
  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  audit(adminId, `dispute.${ruling}`, disputeId, `Ruling recorded for ${dispute.jobId}`);
  notify(dispute.clientId, `Dispute ${dispute.id} ruling: ${ruling}`);
  notify(dispute.freelancerId, `Dispute ${dispute.id} ruling: ${ruling}`);
  return dispute;
}

export async function getPlatformControls() {
  return controls;
}

export async function updatePlatformControl(control, enabled, adminId) {
  ensureAllowed(control, ["registrationsEnabled", "jobPostingEnabled"], "control");
  controls[control] = Boolean(enabled);
  audit(adminId, `control.${control}`, control, `${control} set to ${controls[control]}`);
  return controls;
}

export async function listAuditLog(query) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = query.adminId ? entry.adminId === query.adminId : true;
    const matchesAction = query.actionType ? entry.actionType.startsWith(query.actionType) : true;
    const createdAt = new Date(entry.createdAt).getTime();
    const from = query.from ? new Date(query.from).getTime() : null;
    const to = query.to ? new Date(query.to).getTime() : null;

    return matchesAdmin && matchesAction && (from ? createdAt >= from : true) && (to ? createdAt <= to : true);
  });

  return paginate(filtered, query);
}

export async function listAdminNotifications() {
  return notifications;
}
