const users = [
  {
    id: "usr_client_1",
    name: "Avery Client",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-08",
    activeJobs: 3,
    disputeCount: 1,
    trustScore: 92
  },
  {
    id: "usr_freelancer_1",
    name: "Maya Dev",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-03-20",
    activeJobs: 2,
    disputeCount: 0,
    trustScore: 97
  },
  {
    id: "usr_freelancer_2",
    name: "Jordan UX",
    email: "jordan@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-02-14",
    activeJobs: 0,
    disputeCount: 2,
    trustScore: 64
  },
  {
    id: "usr_client_2",
    name: "Beacon Labs",
    email: "ops@beacon.example",
    role: "client",
    status: "active",
    joinedAt: "2026-05-01",
    activeJobs: 1,
    disputeCount: 0,
    trustScore: 88
  }
];

const moderationQueue = [
  {
    id: "mod_101",
    jobId: "job_101",
    title: "Scrape private customer portals",
    reporter: "automated-policy",
    status: "flagged",
    reason: "Potentially prohibited data access request",
    ownerId: "usr_client_1",
    notified: false
  },
  {
    id: "mod_102",
    jobId: "job_102",
    title: "Migrate legacy API to Node.js",
    reporter: "usr_freelancer_1",
    status: "under_review",
    reason: "Scope changed after proposal acceptance",
    ownerId: "usr_client_2",
    notified: false
  }
];

const disputes = [
  {
    id: "dsp_201",
    jobId: "job_103",
    clientId: "usr_client_1",
    freelancerId: "usr_freelancer_2",
    amount: 900,
    status: "open",
    evidence: ["Scope brief", "Milestone delivery", "Message thread"],
    thread: "Client says final files were incomplete; freelancer says requirements changed.",
    ruling: null
  },
  {
    id: "dsp_202",
    jobId: "job_104",
    clientId: "usr_client_2",
    freelancerId: "usr_freelancer_1",
    amount: 1500,
    status: "under_review",
    evidence: ["Contract", "Demo recording", "Invoice"],
    thread: "Milestone acceptance is blocked on missing deployment notes.",
    ruling: null
  }
];

const controls = {
  registrationsEnabled: true,
  jobPostingEnabled: true,
  updatedAt: "2026-05-27T00:00:00.000Z",
  updatedBy: "system"
};

const auditLog = [
  {
    id: "aud_1",
    adminId: "system",
    action: "seed",
    targetId: "admin-panel",
    note: "Initial admin queue seeded",
    createdAt: "2026-05-27T00:00:00.000Z"
  }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((sum, user) => sum + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((item) => item.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { band: "90-100", count: users.filter((user) => user.trustScore >= 90).length },
      { band: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { band: "0-69", count: users.filter((user) => user.trustScore < 70).length }
    ]
  };
}

export async function listUsers(query = {}) {
  const rows = users.filter((user) => {
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const search = String(query.search ?? "").toLowerCase();
    const matchesSearch = !search
      || user.name.toLowerCase().includes(search)
      || user.email.toLowerCase().includes(search);
    return matchesRole && matchesStatus && matchesSearch;
  });

  return paginate(rows, query);
}

export async function setUserStatus(id, payload, admin) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(payload.status)) {
    throw new Error("Invalid user status");
  }

  const user = findById(users, id);
  user.status = payload.status;
  recordAudit(admin, "user.status", id, payload.reason ?? `Set status to ${payload.status}`);
  return user;
}

export async function listModerationQueue(query = {}) {
  const rows = moderationQueue.filter((item) => !query.status || item.status === query.status);
  return paginate(rows, query);
}

export async function decideModerationItem(id, payload, admin) {
  const allowed = new Set(["approved", "rejected", "escalated"]);
  if (!allowed.has(payload.decision)) {
    throw new Error("Invalid moderation decision");
  }

  const item = findById(moderationQueue, id);
  item.status = payload.decision;
  item.reason = payload.reason ?? item.reason;
  item.notified = payload.decision === "rejected";
  recordAudit(admin, "moderation.decision", id, `${payload.decision}: ${item.reason}`);
  return item;
}

export async function listDisputes(query = {}) {
  const rows = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(rows, query);
}

export async function ruleOnDispute(id, payload, admin) {
  const allowed = new Set(["client", "freelancer", "refund", "escalated"]);
  if (!allowed.has(payload.outcome)) {
    throw new Error("Invalid dispute ruling");
  }

  const dispute = findById(disputes, id);
  dispute.status = payload.outcome === "escalated" ? "under_review" : "resolved";
  dispute.ruling = {
    outcome: payload.outcome,
    note: payload.note ?? "",
    ruledAt: new Date().toISOString(),
    adminId: admin.sub
  };
  recordAudit(admin, "dispute.ruling", id, `${payload.outcome}: ${dispute.ruling.note}`);
  return dispute;
}

export async function getControls() {
  return controls;
}

export async function setControls(payload, admin) {
  if (typeof payload.registrationsEnabled === "boolean") {
    controls.registrationsEnabled = payload.registrationsEnabled;
  }

  if (typeof payload.jobPostingEnabled === "boolean") {
    controls.jobPostingEnabled = payload.jobPostingEnabled;
  }

  controls.updatedAt = new Date().toISOString();
  controls.updatedBy = admin.sub;
  recordAudit(admin, "controls.update", "platform", "Updated platform controls");
  return controls;
}

export async function getAuditLog(query = {}) {
  const rows = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action === query.action;
    return matchesAdmin && matchesAction;
  });

  return paginate(rows, query);
}

function recordAudit(admin, action, targetId, note) {
  auditLog.unshift({
    id: `aud_${auditLog.length + 1}`,
    adminId: admin.sub,
    action,
    targetId,
    note,
    createdAt: new Date().toISOString()
  });
}

function findById(rows, id) {
  const row = rows.find((item) => item.id === id);
  if (!row) {
    throw new Error("Admin record not found");
  }
  return row;
}

function paginate(rows, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    page,
    pageSize,
    total: rows.length,
    totalPages: Math.max(Math.ceil(rows.length / pageSize), 1)
  };
}
