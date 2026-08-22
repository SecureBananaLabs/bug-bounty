const users = [
  {
    id: "usr_admin",
    email: "admin@freelanceflow.test",
    name: "Admin Operator",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04T10:00:00.000Z",
    trustScore: 96,
    activeJobs: [],
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    email: "client@acme.test",
    name: "Acme Client",
    role: "client",
    status: "active",
    joinedAt: "2026-02-12T11:00:00.000Z",
    trustScore: 82,
    activeJobs: ["job_flagged_1", "job_live_2"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    email: "maya@freelance.test",
    name: "Maya Dev",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-01T09:30:00.000Z",
    trustScore: 91,
    activeJobs: ["job_live_2"],
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_client_2",
    email: "safety@market.test",
    name: "Market Safety Client",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-08T16:45:00.000Z",
    trustScore: 47,
    activeJobs: ["job_flagged_2"],
    disputeHistory: ["dsp_2"]
  }
];

const moderationQueue = [
  {
    id: "mod_1",
    jobId: "job_flagged_1",
    title: "Scrape private freelancer contact lists",
    postingUserId: "usr_client_1",
    status: "flagged",
    reason: "Automated privacy-risk classifier matched disallowed scraping language.",
    reports: 3,
    flaggedAt: "2026-05-20T14:20:00.000Z"
  },
  {
    id: "mod_2",
    jobId: "job_flagged_2",
    title: "Payment dispute recovery specialist",
    postingUserId: "usr_client_2",
    status: "escalated",
    reason: "Multiple user reports mention off-platform payment requests.",
    reports: 5,
    flaggedAt: "2026-05-21T08:10:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_1",
    jobId: "job_live_2",
    freelancerId: "usr_freelancer_1",
    clientId: "usr_client_1",
    status: "open",
    amount: 2400,
    transactionId: "txn_7781",
    openedAt: "2026-05-22T13:00:00.000Z",
    thread: [
      { authorId: "usr_client_1", body: "Milestone was delivered late.", createdAt: "2026-05-22T13:04:00.000Z" },
      { authorId: "usr_freelancer_1", body: "Scope changed after approval; evidence attached.", createdAt: "2026-05-22T13:22:00.000Z" }
    ],
    evidence: [
      { id: "ev_1", type: "screenshot", label: "Approved milestone checklist" },
      { id: "ev_2", type: "message", label: "Client scope-change request" }
    ]
  },
  {
    id: "dsp_2",
    jobId: "job_flagged_2",
    freelancerId: "usr_freelancer_1",
    clientId: "usr_client_2",
    status: "under_review",
    amount: 875,
    transactionId: "txn_7794",
    openedAt: "2026-05-23T09:15:00.000Z",
    thread: [
      { authorId: "usr_freelancer_1", body: "Client requested off-platform refund routing.", createdAt: "2026-05-23T09:18:00.000Z" }
    ],
    evidence: [
      { id: "ev_3", type: "message", label: "Off-platform payment request" }
    ]
  }
];

const controls = {
  registrations: { key: "registrations", label: "New user registrations", enabled: true },
  jobPostings: { key: "jobPostings", label: "New job postings", enabled: true }
};

const notifications = [];

const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin",
    actionType: "system.seeded",
    targetType: "admin_panel",
    targetId: "initial-state",
    message: "Initial admin panel audit state loaded.",
    createdAt: "2026-05-24T08:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  const flaggedListings = moderationQueue.filter((item) => item.status !== "approved").length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;

  return {
    totalUsers: users.length,
    activeJobs: 2,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { range: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
    ]
  };
}

export async function getUsers(query = {}) {
  const filtered = users.filter((user) => {
    const search = String(query.search ?? "").toLowerCase();
    const matchesSearch = !search || [user.email, user.name, user.id].some((value) => value.toLowerCase().includes(search));
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const joinedAt = new Date(user.joinedAt).getTime();
    const joinedAfter = query.joinedAfter ? new Date(query.joinedAfter).getTime() : null;
    const joinedBefore = query.joinedBefore ? new Date(query.joinedBefore).getTime() : null;

    return matchesSearch
      && matchesRole
      && matchesStatus
      && (joinedAfter === null || joinedAt >= joinedAfter)
      && (joinedBefore === null || joinedAt <= joinedBefore);
  });

  return paginate(filtered, query);
}

export async function getUserDetail(id) {
  const user = findById(users, id, "User");
  return {
    ...user,
    activeJobs: user.activeJobs.map((jobId) => ({ id: jobId, title: jobTitle(jobId) })),
    disputeHistory: disputes.filter((dispute) => user.disputeHistory.includes(dispute.id))
  };
}

export async function updateUserStatus(id, payload = {}, admin) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(payload.status)) {
    throw new Error("status must be active, suspended, or banned");
  }

  const user = findById(users, id, "User");
  user.status = payload.status;
  writeAudit(admin, "user.status", "user", id, `${user.email} set to ${payload.status}. ${payload.reason ?? ""}`.trim());
  return user;
}

export async function getModerationQueue(query = {}) {
  const filtered = moderationQueue.filter((item) => !query.status || item.status === query.status);
  return paginate(filtered, query);
}

export async function decideListing(id, payload = {}, admin) {
  const allowed = new Set(["approved", "rejected", "escalated"]);
  if (!allowed.has(payload.decision)) {
    throw new Error("decision must be approved, rejected, or escalated");
  }

  const item = findById(moderationQueue, id, "Moderation item");
  item.status = payload.decision;

  if (payload.decision === "rejected") {
    notifications.push({
      id: `ntf_${notifications.length + 1}`,
      userId: item.postingUserId,
      type: "listing_rejected",
      message: payload.reason ?? "Your listing was rejected by moderation.",
      createdAt: new Date().toISOString()
    });
  }

  writeAudit(admin, "listing.decision", "job", item.jobId, `${item.title} marked ${payload.decision}. ${payload.reason ?? ""}`.trim());
  return item;
}

export async function getDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function getDisputeDetail(id) {
  return findById(disputes, id, "Dispute");
}

export async function ruleDispute(id, payload = {}, admin) {
  const allowed = new Set(["client", "freelancer", "refund", "escalate"]);
  if (!allowed.has(payload.ruling)) {
    throw new Error("ruling must be client, freelancer, refund, or escalate");
  }

  const dispute = findById(disputes, id, "Dispute");
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingReason = payload.reason ?? "";
  dispute.resolvedAt = payload.ruling === "escalate" ? null : new Date().toISOString();

  notifications.push(
    {
      id: `ntf_${notifications.length + 1}`,
      userId: dispute.clientId,
      type: "dispute_ruling",
      message: `Dispute ${dispute.id} updated: ${payload.ruling}.`,
      createdAt: new Date().toISOString()
    },
    {
      id: `ntf_${notifications.length + 1}`,
      userId: dispute.freelancerId,
      type: "dispute_ruling",
      message: `Dispute ${dispute.id} updated: ${payload.ruling}.`,
      createdAt: new Date().toISOString()
    }
  );

  writeAudit(admin, "dispute.ruling", "dispute", id, `Ruling ${payload.ruling}. ${payload.reason ?? ""}`.trim());
  return dispute;
}

export async function getControls() {
  return Object.values(controls);
}

export async function updateControl(key, payload = {}, admin) {
  if (!Object.hasOwn(controls, key)) {
    throw new Error("Unknown platform control");
  }

  controls[key].enabled = Boolean(payload.enabled);
  writeAudit(admin, "platform.control", "control", key, `${controls[key].label} set to ${controls[key].enabled}`);
  return controls[key];
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const createdAt = new Date(entry.createdAt).getTime();
    const from = query.from ? new Date(query.from).getTime() : null;
    const to = query.to ? new Date(query.to).getTime() : null;

    return (!query.adminId || entry.adminId === query.adminId)
      && (!query.actionType || entry.actionType === query.actionType)
      && (from === null || createdAt >= from)
      && (to === null || createdAt <= to);
  });

  return paginate(filtered.toReversed(), query);
}

function paginate(items, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1),
    items: items.slice(start, start + pageSize)
  };
}

function findById(items, id, label) {
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`${label} not found`);
  }
  return item;
}

function writeAudit(admin, actionType, targetType, targetId, message) {
  auditLog.push({
    id: `aud_${auditLog.length + 1}`,
    adminId: admin?.sub ?? "unknown_admin",
    actionType,
    targetType,
    targetId,
    message,
    createdAt: new Date().toISOString()
  });
}

function jobTitle(jobId) {
  return moderationQueue.find((item) => item.jobId === jobId)?.title ?? "Active marketplace job";
}
