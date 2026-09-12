const users = [
  {
    id: "usr_admin",
    email: "admin@freelanceflow.test",
    fullName: "Nora Admin",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    skills: ["operations"],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    email: "client@example.com",
    fullName: "Priya Shah",
    role: "client",
    status: "active",
    joinedAt: "2026-02-11",
    skills: [],
    disputeHistory: ["dsp_100"]
  },
  {
    id: "usr_freelancer_1",
    email: "maya@example.com",
    fullName: "Maya Bennett",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-18",
    skills: ["Next.js", "TypeScript"],
    disputeHistory: ["dsp_100"]
  },
  {
    id: "usr_freelancer_2",
    email: "leo@example.com",
    fullName: "Leo Alvarez",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-04-02",
    skills: ["API design"],
    disputeHistory: []
  }
];

const jobs = [
  {
    id: "job_101",
    title: "Build an AI customer support widget",
    clientId: "usr_client_1",
    clientName: "Priya Shah",
    budget: 1500,
    status: "open",
    postedAt: "2026-05-04",
    assignedFreelancerId: "usr_freelancer_1"
  },
  {
    id: "job_102",
    title: "Migrate legacy API to Node.js",
    clientId: "usr_client_1",
    clientName: "Priya Shah",
    budget: 2800,
    status: "flagged",
    flagReason: "Suspicious payment terms reported by two users",
    reportCount: 2,
    postedAt: "2026-05-12"
  },
  {
    id: "job_103",
    title: "Design SaaS onboarding flows",
    clientId: "usr_client_1",
    clientName: "Priya Shah",
    budget: 900,
    status: "escalated",
    flagReason: "Manual review requested after rejection appeal",
    reportCount: 1,
    postedAt: "2026-05-17"
  }
];

const disputes = [
  {
    id: "dsp_100",
    status: "open",
    jobId: "job_101",
    jobTitle: "Build an AI customer support widget",
    clientId: "usr_client_1",
    clientName: "Priya Shah",
    freelancerId: "usr_freelancer_1",
    freelancerName: "Maya Bennett",
    amount: 750,
    transactionId: "pay_7781",
    createdAt: "2026-05-20",
    evidence: [
      "Client reports missing handoff notes",
      "Freelancer uploaded repository link and demo recording"
    ],
    thread: [
      { from: "client", message: "The widget works, but the handoff is incomplete." },
      { from: "freelancer", message: "I added the demo and setup instructions to the job thread." }
    ]
  }
];

const platformControls = {
  newUserRegistrations: "enabled",
  jobPosting: "enabled",
  automaticPayouts: "review_required",
  disputeAutoEscalation: "enabled"
};

const auditLog = [
  {
    id: "audit_100",
    actorId: "system",
    action: "flag_job",
    targetType: "job",
    targetId: "job_102",
    createdAt: "2026-05-12T09:00:00.000Z",
    note: "Job entered moderation queue after repeated reports"
  }
];

function addAudit(actorId, action, targetType, targetId, note) {
  const entry = {
    id: `audit_${Date.now()}`,
    actorId,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
    note
  };
  auditLog.unshift(entry);
  return entry;
}

function matchesSearch(user, search) {
  if (!search) {
    return true;
  }

  const needle = search.toLowerCase();
  return [user.fullName, user.email, user.id].some((value) => value.toLowerCase().includes(needle));
}

function requireRecord(record, label) {
  if (!record) {
    const error = new Error(`${label} not found`);
    error.statusCode = 404;
    throw error;
  }

  return record;
}

export async function getAdminMetrics() {
  const activeUsers = users.filter((user) => user.status === "active").length;
  const activeFreelancers = users.filter((user) => user.role === "freelancer" && user.status === "active").length;
  const flaggedAccounts = users.filter((user) => user.status !== "active").length;
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const moderationItems = jobs.filter((job) => ["flagged", "escalated"].includes(job.status)).length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const monthlyVolume = jobs.reduce((sum, job) => sum + job.budget, 0);

  return { activeUsers, activeFreelancers, flaggedAccounts, openJobs, moderationItems, openDisputes, monthlyVolume };
}

export async function listAdminUsers(filters = {}) {
  const { role, status, search, joinedFrom, joinedTo } = filters;
  return users
    .filter((user) => !role || user.role === role)
    .filter((user) => !status || user.status === status)
    .filter((user) => matchesSearch(user, search))
    .filter((user) => !joinedFrom || user.joinedAt >= joinedFrom)
    .filter((user) => !joinedTo || user.joinedAt <= joinedTo)
    .map((user) => ({
      ...user,
      activeJobs: jobs.filter((job) => job.clientId === user.id || job.assignedFreelancerId === user.id).length,
      disputes: disputes.filter((dispute) => dispute.clientId === user.id || dispute.freelancerId === user.id).length
    }));
}

export async function getAdminUser(userID) {
  const user = requireRecord(users.find((item) => item.id === userID), "User");
  return {
    ...user,
    activeJobs: jobs.filter((job) => job.clientId === user.id || job.assignedFreelancerId === user.id),
    disputeHistory: disputes.filter((dispute) => dispute.clientId === user.id || dispute.freelancerId === user.id)
  };
}

export async function updateUserStatus(userID, payload, actor) {
  const allowedStatuses = ["active", "suspended", "banned"];
  if (!allowedStatuses.includes(payload.status)) {
    const error = new Error("Invalid user status");
    error.statusCode = 400;
    throw error;
  }

  const user = requireRecord(users.find((item) => item.id === userID), "User");
  user.status = payload.status;
  user.statusReason = payload.reason ?? "";
  addAudit(actor.sub, "update_user_status", "user", userID, payload.reason ?? `Set status to ${payload.status}`);
  return user;
}

export async function listModerationJobs(filters = {}) {
  const { status } = filters;
  return jobs.filter((job) => !status || job.status === status);
}

export async function moderateJob(jobID, payload, actor) {
  const actions = {
    approve: "open",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = actions[payload.action];
  if (!nextStatus) {
    const error = new Error("Invalid moderation action");
    error.statusCode = 400;
    throw error;
  }

  const job = requireRecord(jobs.find((item) => item.id === jobID), "Job");
  job.status = nextStatus;
  job.moderationReason = payload.reason ?? "";
  job.lastModeratedAt = new Date().toISOString();
  addAudit(actor.sub, `moderation_${payload.action}`, "job", jobID, payload.reason ?? `Marked ${nextStatus}`);
  return job;
}

export async function listDisputes(filters = {}) {
  const { status } = filters;
  return disputes.filter((dispute) => !status || dispute.status === status);
}

export async function getDispute(disputeID) {
  return requireRecord(disputes.find((item) => item.id === disputeID), "Dispute");
}

export async function resolveDispute(disputeID, payload, actor) {
  const allowedRulings = ["client", "freelancer", "refund", "escalate"];
  if (!allowedRulings.includes(payload.ruling)) {
    const error = new Error("Invalid dispute ruling");
    error.statusCode = 400;
    throw error;
  }

  const dispute = requireRecord(disputes.find((item) => item.id === disputeID), "Dispute");
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.resolutionNote = payload.note ?? "";
  dispute.updatedAt = new Date().toISOString();
  addAudit(actor.sub, "resolve_dispute", "dispute", disputeID, payload.note ?? `Ruling: ${payload.ruling}`);
  return dispute;
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(payload, actor) {
  if (!Object.hasOwn(platformControls, payload.key)) {
    const error = new Error("Unknown platform control");
    error.statusCode = 404;
    throw error;
  }

  platformControls[payload.key] = payload.value;
  addAudit(actor.sub, "update_platform_control", "control", payload.key, `Set ${payload.key} to ${payload.value}`);
  return platformControls;
}

export async function getPlatformHealth() {
  return {
    api: "online",
    database: "configured",
    payments: platformControls.automaticPayouts,
    queueDepth: jobs.filter((job) => ["flagged", "escalated"].includes(job.status)).length + disputes.filter((dispute) => dispute.status !== "resolved").length
  };
}

export async function listAuditLog() {
  return auditLog;
}
