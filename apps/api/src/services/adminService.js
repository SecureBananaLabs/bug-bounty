const users = [
  {
    id: "usr_1001",
    name: "Avery Chen",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01T14:12:00.000Z",
    trustScore: 94,
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_1002",
    name: "Mina Patel",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-03T09:45:00.000Z",
    trustScore: 88,
    activeJobs: 1,
    disputes: 1
  },
  {
    id: "usr_1003",
    name: "Jonas Reed",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18T16:08:00.000Z",
    trustScore: 43,
    activeJobs: 0,
    disputes: 2
  },
  {
    id: "usr_admin",
    name: "Operations Admin",
    role: "admin",
    status: "active",
    joinedAt: "2026-04-01T08:00:00.000Z",
    trustScore: 100,
    activeJobs: 0,
    disputes: 0
  }
];

const flaggedListings = [
  {
    id: "job_2001",
    title: "Urgent payment gateway review",
    clientId: "usr_1001",
    reason: "High budget change after posting",
    status: "flagged",
    severity: "medium",
    reportedAt: "2026-05-27T13:10:00.000Z"
  },
  {
    id: "job_2002",
    title: "Data scraping automation",
    clientId: "usr_1003",
    reason: "Potential policy violation",
    status: "under_review",
    severity: "high",
    reportedAt: "2026-05-28T03:30:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_3001",
    jobId: "job_2001",
    clientId: "usr_1001",
    freelancerId: "usr_1002",
    status: "open",
    amount: 1800,
    openedAt: "2026-05-27T20:20:00.000Z",
    thread: [
      { authorId: "usr_1002", body: "Milestone delivered, awaiting release." },
      { authorId: "usr_1001", body: "Needs one more QA pass." }
    ],
    evidence: ["milestone-delivery.zip", "qa-notes.md"]
  },
  {
    id: "dsp_3002",
    jobId: "job_2002",
    clientId: "usr_1003",
    freelancerId: "usr_1002",
    status: "under_review",
    amount: 650,
    openedAt: "2026-05-26T18:15:00.000Z",
    thread: [
      { authorId: "usr_1003", body: "Requested cancellation before delivery." }
    ],
    evidence: ["scope-chat.txt"]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin",
    action: "moderation.reviewed",
    targetId: "job_1999",
    detail: "Escalated duplicate listing",
    createdAt: "2026-05-27T12:00:00.000Z"
  }
];

function paginate(records, query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: records.slice(start, start + pageSize),
    page,
    pageSize,
    total: records.length,
    totalPages: Math.max(Math.ceil(records.length / pageSize), 1)
  };
}

function recordAudit(adminId, action, targetId, detail) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    action,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };

  auditLog.push(entry);
  return entry;
}

function matchesText(value, query) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedCount = flaggedListings.filter((listing) => listing.status !== "approved").length;

  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes,
    flaggedListings: flaggedCount,
    revenueCurrentPeriod: 128900,
    trustScoreDistribution: [
      { bucket: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { bucket: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { bucket: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ],
    platformControls
  };
}

export async function listUsers(query) {
  let records = [...users];

  if (query.role) {
    records = records.filter((user) => user.role === query.role);
  }

  if (query.status) {
    records = records.filter((user) => user.status === query.status);
  }

  if (query.q) {
    records = records.filter((user) => matchesText(user.name, query.q) || matchesText(user.id, query.q));
  }

  return paginate(records, query);
}

export async function getUserProfile(userId) {
  const user = users.find((record) => record.id === userId);
  if (!user) {
    return null;
  }

  return {
    ...user,
    jobs: flaggedListings.filter((listing) => listing.clientId === userId),
    disputes: disputes.filter((dispute) => dispute.clientId === userId || dispute.freelancerId === userId)
  };
}

export async function updateUserStatus(userId, status, adminId) {
  if (!["active", "suspended", "banned"].includes(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((record) => record.id === userId);
  if (!user) {
    return null;
  }

  user.status = status;
  recordAudit(adminId, `user.${status}`, userId, `User status changed to ${status}`);
  return user;
}

export async function listModerationQueue(query) {
  let records = [...flaggedListings];

  if (query.status) {
    records = records.filter((listing) => listing.status === query.status);
  }

  if (query.severity) {
    records = records.filter((listing) => listing.severity === query.severity);
  }

  return paginate(records, query);
}

export async function decideListing(listingId, decision, reason, adminId) {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    throw new Error("Unsupported moderation decision");
  }

  const listing = flaggedListings.find((record) => record.id === listingId);
  if (!listing) {
    return null;
  }

  listing.status = decision;
  listing.resolutionReason = reason ?? "";
  recordAudit(adminId, `listing.${decision}`, listingId, reason ?? `Listing ${decision}`);

  return {
    listing,
    notification: {
      recipientId: listing.clientId,
      message: `Your listing "${listing.title}" was ${decision}.`
    }
  };
}

export async function listDisputes(query) {
  let records = [...disputes];

  if (query.status) {
    records = records.filter((dispute) => dispute.status === query.status);
  }

  return paginate(records, query);
}

export async function getDispute(disputeId) {
  return disputes.find((record) => record.id === disputeId) ?? null;
}

export async function ruleOnDispute(disputeId, payload, adminId) {
  const dispute = disputes.find((record) => record.id === disputeId);
  if (!dispute) {
    return null;
  }

  const ruling = payload.ruling;
  if (!["client", "freelancer", "escalate"].includes(ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.refund = Boolean(payload.refund);
  recordAudit(adminId, `dispute.${ruling}`, disputeId, payload.reason ?? `Ruling: ${ruling}`);

  return {
    dispute,
    notifications: [dispute.clientId, dispute.freelancerId].map((recipientId) => ({
      recipientId,
      message: `Dispute ${dispute.id} was updated by admin.`
    }))
  };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControls(payload, adminId) {
  if (typeof payload.registrationsEnabled === "boolean") {
    platformControls.registrationsEnabled = payload.registrationsEnabled;
    recordAudit(adminId, "controls.registrations", "platform", `Registrations set to ${payload.registrationsEnabled}`);
  }

  if (typeof payload.jobPostingsEnabled === "boolean") {
    platformControls.jobPostingsEnabled = payload.jobPostingsEnabled;
    recordAudit(adminId, "controls.jobPostings", "platform", `Job postings set to ${payload.jobPostingsEnabled}`);
  }

  return platformControls;
}

export async function listAuditLog(query) {
  let records = [...auditLog].reverse();

  if (query.adminId) {
    records = records.filter((entry) => entry.adminId === query.adminId);
  }

  if (query.action) {
    records = records.filter((entry) => entry.action.startsWith(query.action));
  }

  return paginate(records, query);
}
