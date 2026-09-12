const users = [
  {
    id: "usr_admin",
    name: "Maya Admin",
    email: "maya.admin@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-05T10:00:00.000Z",
    trustScore: 98,
    activeJobs: 2,
    disputeCount: 0
  },
  {
    id: "usr_client_1",
    name: "Nora Client",
    email: "nora.client@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-12T09:30:00.000Z",
    trustScore: 74,
    activeJobs: 3,
    disputeCount: 1
  },
  {
    id: "usr_freelancer_1",
    name: "Leo Freelancer",
    email: "leo.freelancer@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-18T14:45:00.000Z",
    trustScore: 41,
    activeJobs: 1,
    disputeCount: 2
  },
  {
    id: "usr_freelancer_2",
    name: "Ava Designer",
    email: "ava.designer@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-01T16:20:00.000Z",
    trustScore: 89,
    activeJobs: 5,
    disputeCount: 0
  }
];

const flaggedListings = [
  {
    id: "job_flagged_1",
    title: "Scrape competitor customer list",
    postedBy: "usr_client_1",
    reason: "Possible privacy violation",
    risk: "high",
    status: "pending",
    createdAt: "2026-05-15T08:00:00.000Z",
    notificationQueued: false
  },
  {
    id: "job_flagged_2",
    title: "Landing page copy review",
    postedBy: "usr_client_1",
    reason: "Automated duplicate listing signal",
    risk: "medium",
    status: "pending",
    createdAt: "2026-05-16T11:10:00.000Z",
    notificationQueued: false
  }
];

const disputes = [
  {
    id: "dsp_1001",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_1",
    jobId: "job_778",
    amount: 850,
    status: "open",
    openedAt: "2026-05-14T12:00:00.000Z",
    transactionId: "pay_778",
    thread: [
      "Client: Deliverable missed the agreed milestone.",
      "Freelancer: Scope changed after kickoff."
    ],
    evidence: ["contract.pdf", "milestone-chat.txt"],
    outcome: null,
    notificationsQueued: []
  },
  {
    id: "dsp_1002",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_2",
    jobId: "job_812",
    amount: 300,
    status: "under_review",
    openedAt: "2026-05-13T15:45:00.000Z",
    transactionId: "pay_812",
    thread: ["Freelancer: Awaiting approval on final files."],
    evidence: ["delivery.zip"],
    outcome: null,
    notificationsQueued: []
  }
];

const platformControls = {
  registrationEnabled: true,
  jobPostingEnabled: true,
  updatedAt: "2026-05-17T00:00:00.000Z",
  updatedBy: "system"
};

const auditLog = [
  {
    id: "aud_seed_1",
    adminId: "usr_admin",
    action: "admin.dashboard.seeded",
    targetType: "system",
    targetId: "platform",
    createdAt: "2026-05-17T00:00:00.000Z",
    reason: "Initial moderation dataset"
  }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status === "pending").length,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: {
      high: users.filter((user) => user.trustScore >= 80).length,
      medium: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length,
      low: users.filter((user) => user.trustScore < 50).length
    },
    platformControls
  };
}

export async function listUsers(query = {}) {
  const page = positiveInt(query.page, 1);
  const pageSize = Math.min(positiveInt(query.pageSize, 10), 50);
  const search = String(query.q ?? "").trim().toLowerCase();

  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesJoinedAfter =
      !query.joinedAfter || Date.parse(user.joinedAt) >= Date.parse(query.joinedAfter);

    return matchesSearch && matchesRole && matchesStatus && matchesJoinedAfter;
  });

  return paginate(filtered, page, pageSize);
}

export async function getUserProfile(id) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return null;
  }

  return {
    ...user,
    activeJobs: sampleJobsForUser(user),
    disputeHistory: disputes.filter(
      (dispute) => dispute.clientId === user.id || dispute.freelancerId === user.id
    )
  };
}

export async function setUserStatus(id, payload, admin) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return null;
  }

  const nextStatus = payload.status;
  if (!["active", "suspended", "banned"].includes(nextStatus)) {
    return { error: "status must be active, suspended, or banned" };
  }

  user.status = nextStatus;
  writeAudit(admin, `admin.user.${nextStatus}`, "user", id, payload.reason);
  return { user };
}

export async function listModerationQueue(query = {}) {
  const page = positiveInt(query.page, 1);
  const pageSize = Math.min(positiveInt(query.pageSize, 10), 50);
  const status = query.status;
  const filtered = status
    ? flaggedListings.filter((listing) => listing.status === status)
    : flaggedListings;

  return paginate(filtered, page, pageSize);
}

export async function moderateJob(id, payload, admin) {
  const listing = flaggedListings.find((candidate) => candidate.id === id);
  if (!listing) {
    return null;
  }

  const action = payload.action;
  if (!["approve", "reject", "escalate"].includes(action)) {
    return { error: "action must be approve, reject, or escalate" };
  }

  if (action === "reject" && !payload.reason) {
    return { error: "reason is required when rejecting a listing" };
  }

  listing.status =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  listing.resolutionReason = payload.reason ?? "";
  listing.reviewedAt = new Date().toISOString();
  listing.reviewedBy = admin.sub;
  listing.notificationQueued = action === "reject";
  writeAudit(admin, `admin.job.${action}`, "job", id, payload.reason);

  return { listing };
}

export async function listDisputes(query = {}) {
  const page = positiveInt(query.page, 1);
  const pageSize = Math.min(positiveInt(query.pageSize, 10), 50);
  const status = query.status;
  const filtered = status ? disputes.filter((dispute) => dispute.status === status) : disputes;

  return paginate(filtered, page, pageSize);
}

export async function getDispute(id) {
  return disputes.find((candidate) => candidate.id === id) ?? null;
}

export async function resolveDispute(id, payload, admin) {
  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) {
    return null;
  }

  const decision = payload.decision;
  if (!["client", "freelancer", "escalate"].includes(decision)) {
    return { error: "decision must be client, freelancer, or escalate" };
  }

  dispute.status = decision === "escalate" ? "under_review" : "resolved";
  dispute.outcome = {
    decision,
    reason: payload.reason ?? "",
    refundQueued: decision === "client",
    resolvedAt: new Date().toISOString(),
    resolvedBy: admin.sub
  };
  dispute.notificationsQueued = [dispute.clientId, dispute.freelancerId];
  writeAudit(admin, `admin.dispute.${decision}`, "dispute", id, payload.reason);

  return { dispute };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function setPlatformControl(payload, admin) {
  if (payload.confirm !== true) {
    return { error: "confirm must be true before changing platform controls" };
  }

  const allowedControls = ["registrationEnabled", "jobPostingEnabled"];
  const control = payload.control;
  if (!allowedControls.includes(control)) {
    return { error: "control must be registrationEnabled or jobPostingEnabled" };
  }

  platformControls[control] = Boolean(payload.enabled);
  platformControls.updatedAt = new Date().toISOString();
  platformControls.updatedBy = admin.sub;
  writeAudit(admin, `admin.platform.${control}`, "platform_control", control, payload.reason);

  return { controls: platformControls };
}

export async function listAdminAuditLog(query = {}) {
  const page = positiveInt(query.page, 1);
  const pageSize = Math.min(positiveInt(query.pageSize, 20), 100);
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action === query.action;
    const matchesDate =
      !query.from || Date.parse(entry.createdAt) >= Date.parse(String(query.from));

    return matchesAdmin && matchesAction && matchesDate;
  });

  return paginate([...filtered].reverse(), page, pageSize);
}

function writeAudit(admin, action, targetType, targetId, reason = "") {
  auditLog.push({
    id: `aud_${Date.now()}_${auditLog.length}`,
    adminId: admin.sub,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
    reason
  });
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize))
  };
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sampleJobsForUser(user) {
  return Array.from({ length: user.activeJobs }, (_, index) => ({
    id: `job_${user.id}_${index + 1}`,
    title: `${user.role} workspace task ${index + 1}`,
    status: index % 2 === 0 ? "active" : "review"
  }));
}
