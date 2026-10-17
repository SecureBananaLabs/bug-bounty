const users = [
  { id: "usr_1001", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", trustScore: 96, joinedAt: "2026-05-01", activeJobs: 3, disputes: 0 },
  { id: "usr_1002", name: "Owen Grant", email: "owen@example.com", role: "client", status: "active", trustScore: 88, joinedAt: "2026-04-18", activeJobs: 5, disputes: 1 },
  { id: "usr_1003", name: "Priya Shah", email: "priya@example.com", role: "freelancer", status: "suspended", trustScore: 42, joinedAt: "2026-03-12", activeJobs: 1, disputes: 2 },
  { id: "usr_1004", name: "Jon Bell", email: "jon@example.com", role: "freelancer", status: "active", trustScore: 79, joinedAt: "2026-05-09", activeJobs: 2, disputes: 0 },
  { id: "usr_1005", name: "Lina Park", email: "lina@example.com", role: "client", status: "flagged", trustScore: 51, joinedAt: "2026-04-29", activeJobs: 4, disputes: 2 },
];

const moderationJobs = [
  { id: "job_flagged_1", title: "AI marketplace scraper", client: "Lina Park", reason: "Potential ToS violation", status: "flagged", risk: "high", reportedAt: "2026-05-22T09:20:00Z" },
  { id: "job_flagged_2", title: "Mobile app payment review", client: "Owen Grant", reason: "Budget mismatch", status: "under_review", risk: "medium", reportedAt: "2026-05-22T10:05:00Z" },
  { id: "job_flagged_3", title: "Data annotation sprint", client: "Mara Hill", reason: "User report", status: "flagged", risk: "low", reportedAt: "2026-05-22T10:44:00Z" },
];

const disputes = [
  { id: "dsp_9001", job: "Admin dashboard review", freelancer: "Maya Chen", client: "Owen Grant", amount: 450, status: "open", evidenceCount: 4 },
  { id: "dsp_9002", job: "API integration", freelancer: "Priya Shah", client: "Lina Park", amount: 820, status: "under_review", evidenceCount: 7 },
  { id: "dsp_9003", job: "Landing page QA", freelancer: "Jon Bell", client: "Owen Grant", amount: 260, status: "resolved", evidenceCount: 3 },
];

const platformControls = {
  registrations: { enabled: true, label: "New registrations" },
  jobPosting: { enabled: true, label: "New job posting" },
};

const auditLog = [
  { id: "aud_1", adminId: "usr_admin", actionType: "listing_review", targetId: "job_flagged_2", details: "Escalated for senior review", createdAt: "2026-05-22T10:08:00Z" },
  { id: "aud_2", adminId: "usr_admin", actionType: "account_status", targetId: "usr_1003", details: "Suspended after duplicate dispute evidence", createdAt: "2026-05-22T10:18:00Z" },
];

function paginate(items, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: items.length,
    items: items.slice(start, start + pageSize),
  };
}

function addAudit(actionType, targetId, details, admin) {
  const entry = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId: admin?.sub ?? "unknown_admin",
    actionType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };
  auditLog.unshift(entry);
  return entry;
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationJobs.filter((job) => job.status !== "approved").length;

  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { label: "High", count: users.filter((user) => user.trustScore >= 80).length },
      { label: "Medium", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
      { label: "Low", count: users.filter((user) => user.trustScore < 50).length },
    ],
    platformControls,
  };
}

export async function getUsers(query = {}) {
  const search = String(query.search ?? "").toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    return matchesSearch && matchesRole && matchesStatus;
  });
  return paginate(filtered, query);
}

export async function setUserStatus(userId, payload, admin) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  user.status = payload.status;
  const entry = addAudit("account_status", userId, payload.reason ?? `Set status to ${payload.status}`, admin);
  return { user, audit: entry };
}

export async function getModerationJobs(query = {}) {
  const filtered = moderationJobs.filter((job) => !query.status || job.status === query.status);
  return paginate(filtered, query);
}

export async function decideJobListing(jobId, payload, admin) {
  const job = moderationJobs.find((item) => item.id === jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  job.status = payload.decision === "approve" ? "approved" : payload.decision === "reject" ? "rejected" : "escalated";
  job.decisionReason = payload.reason;
  const entry = addAudit("listing_review", jobId, `${payload.decision}: ${payload.reason}`, admin);
  return { job, audit: entry, notificationQueued: true };
}

export async function getDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function submitDisputeRuling(disputeId, payload, admin) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    throw new Error(`Dispute ${disputeId} not found`);
  }
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  const entry = addAudit("dispute_ruling", disputeId, `${payload.ruling}: ${payload.reason}`, admin);
  return { dispute, audit: entry, partiesNotified: true };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function setPlatformControl(payload, admin) {
  if (!platformControls[payload.key]) {
    throw new Error(`Unknown platform control ${payload.key}`);
  }
  platformControls[payload.key].enabled = Boolean(payload.enabled);
  const entry = addAudit("platform_toggle", payload.key, payload.reason ?? `${payload.key} set to ${payload.enabled}`, admin);
  return { controls: platformControls, audit: entry };
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.actionType || entry.actionType === query.actionType;
    return matchesAdmin && matchesAction;
  });
  return paginate(filtered, query);
}
