const users = [
  { id: "usr_101", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", trustScore: 98, joinedAt: "2026-03-15" },
  { id: "usr_102", name: "Jordan Lee", email: "jordan@example.com", role: "client", status: "active", trustScore: 91, joinedAt: "2026-03-21" },
  { id: "usr_103", name: "Priya Raman", email: "priya@example.com", role: "freelancer", status: "review", trustScore: 72, joinedAt: "2026-04-02" },
  { id: "usr_104", name: "Northstar Labs", email: "ops@northstar.test", role: "client", status: "suspended", trustScore: 48, joinedAt: "2026-04-18" }
];

const moderationJobs = [
  { id: "job_201", title: "AI customer support widget", client: "Northstar Labs", status: "flagged", risk: "high", budget: 1500, reason: "External payment request" },
  { id: "job_202", title: "Node.js API migration", client: "AtlasWorks", status: "queued", risk: "medium", budget: 2800, reason: "Large fixed scope" },
  { id: "job_203", title: "SaaS onboarding redesign", client: "HaloStart", status: "approved", risk: "low", budget: 900, reason: "Clean listing" }
];

const disputes = [
  { id: "dsp_301", jobTitle: "Backend audit", client: "Northstar Labs", freelancer: "Maya Chen", status: "open", amount: 640, openedAt: "2026-05-22" },
  { id: "dsp_302", jobTitle: "Landing page copy", client: "HaloStart", freelancer: "Priya Raman", status: "evidence", amount: 280, openedAt: "2026-05-24" }
];

const controls = {
  registrationOpen: true,
  jobPostingOpen: true,
  payoutReviewRequired: true,
  maintenanceMode: false
};

const auditEvents = [
  { id: "aud_001", actor: "system", action: "daily_metrics_refreshed", target: "platform", createdAt: "2026-05-29T08:15:00.000Z" },
  { id: "aud_002", actor: "admin_1", action: "job_flag_reviewed", target: "job_201", createdAt: "2026-05-29T09:30:00.000Z" }
];

const userStatuses = new Set(["active", "review", "suspended", "banned"]);
const jobStatuses = new Set(["queued", "flagged", "approved", "rejected"]);
const disputeStatuses = new Set(["open", "evidence", "refunded", "released", "escalated"]);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.min(50, Math.max(1, Number(pageSize) || 10));
  const start = (normalizedPage - 1) * normalizedPageSize;

  return {
    items: items.slice(start, start + normalizedPageSize),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / normalizedPageSize))
  };
}

function includesText(value, needle) {
  return String(value).toLowerCase().includes(String(needle).toLowerCase());
}

function recordAudit(actor, action, target) {
  const event = {
    id: `aud_${String(auditEvents.length + 1).padStart(3, "0")}`,
    actor,
    action,
    target,
    createdAt: new Date().toISOString()
  };
  auditEvents.unshift(event);
  return event;
}

function actorFromUser(user) {
  return user?.sub ?? "admin";
}

export async function getAdminMetrics() {
  return {
    openJobs: moderationJobs.filter((job) => job.status !== "rejected").length,
    activeFreelancers: users.filter((user) => user.role === "freelancer" && user.status === "active").length,
    flaggedAccounts: users.filter((user) => ["review", "suspended", "banned"].includes(user.status)).length,
    pendingDisputes: disputes.filter((dispute) => ["open", "evidence"].includes(dispute.status)).length,
    monthlyVolume: moderationJobs.reduce((sum, job) => sum + job.budget, 0)
  };
}

export async function getAdminOverview() {
  return {
    metrics: await getAdminMetrics(),
    controls: { ...controls },
    queues: {
      usersInReview: users.filter((user) => user.status === "review").length,
      flaggedJobs: moderationJobs.filter((job) => job.status === "flagged").length,
      openDisputes: disputes.filter((dispute) => dispute.status === "open").length
    },
    recentAudit: auditEvents.slice(0, 5)
  };
}

export async function listAdminUsers(query = {}) {
  const { q = "", role = "all", status = "all" } = query;
  const filtered = users.filter((user) => {
    const matchesText = !q || includesText(user.name, q) || includesText(user.email, q);
    const matchesRole = role === "all" || user.role === role;
    const matchesStatus = status === "all" || user.status === status;
    return matchesText && matchesRole && matchesStatus;
  });

  return paginate(filtered, query);
}

export async function updateUserStatus(id, status, actor, reason = "") {
  if (!userStatuses.has(status)) {
    throw httpError(400, "Unsupported user status");
  }

  const user = users.find((entry) => entry.id === id);
  if (!user) {
    throw httpError(404, "User not found");
  }

  user.status = status;
  user.reviewNote = reason || undefined;
  recordAudit(actorFromUser(actor), `user_status_${status}`, id);
  return user;
}

export async function listModerationJobs(query = {}) {
  const { q = "", status = "all", risk = "all" } = query;
  const filtered = moderationJobs.filter((job) => {
    const matchesText = !q || includesText(job.title, q) || includesText(job.client, q);
    const matchesStatus = status === "all" || job.status === status;
    const matchesRisk = risk === "all" || job.risk === risk;
    return matchesText && matchesStatus && matchesRisk;
  });

  return paginate(filtered, query);
}

export async function updateModerationJob(id, status, actor, reason = "") {
  if (!jobStatuses.has(status)) {
    throw httpError(400, "Unsupported job moderation status");
  }

  const job = moderationJobs.find((entry) => entry.id === id);
  if (!job) {
    throw httpError(404, "Job not found");
  }

  job.status = status;
  job.reason = reason || job.reason;
  recordAudit(actorFromUser(actor), `job_${status}`, id);
  return job;
}

export async function listDisputes(query = {}) {
  const { q = "", status = "all" } = query;
  const filtered = disputes.filter((dispute) => {
    const matchesText = !q || includesText(dispute.jobTitle, q) || includesText(dispute.client, q) || includesText(dispute.freelancer, q);
    const matchesStatus = status === "all" || dispute.status === status;
    return matchesText && matchesStatus;
  });

  return paginate(filtered, query);
}

export async function updateDispute(id, status, actor, note = "") {
  if (!disputeStatuses.has(status)) {
    throw httpError(400, "Unsupported dispute status");
  }

  const dispute = disputes.find((entry) => entry.id === id);
  if (!dispute) {
    throw httpError(404, "Dispute not found");
  }

  dispute.status = status;
  dispute.adminNote = note || undefined;
  recordAudit(actorFromUser(actor), `dispute_${status}`, id);
  return dispute;
}

export async function getPlatformControls() {
  return { ...controls };
}

export async function updatePlatformControls(nextControls, actor) {
  for (const key of Object.keys(nextControls)) {
    if (!(key in controls) || typeof nextControls[key] !== "boolean") {
      throw httpError(400, "Unsupported control value");
    }
  }

  Object.assign(controls, nextControls);
  recordAudit(actorFromUser(actor), "platform_controls_updated", "controls");
  return { ...controls };
}

export async function listAuditEvents(query = {}) {
  const { q = "" } = query;
  const filtered = auditEvents.filter((event) => (
    !q || includesText(event.action, q) || includesText(event.actor, q) || includesText(event.target, q)
  ));

  return paginate(filtered, query);
}
