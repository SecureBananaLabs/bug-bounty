const users = [
  { id: "usr_client_1", name: "Maya Chen", email: "maya@example.com", role: "client", status: "active", joinedAt: "2026-01-12T09:00:00.000Z", trustScore: 92, activeJobs: ["job_101"], disputeHistory: ["dsp_301"] },
  { id: "usr_freelancer_1", name: "Ravi Patel", email: "ravi@example.com", role: "freelancer", status: "active", joinedAt: "2026-02-18T12:30:00.000Z", trustScore: 78, activeJobs: ["job_102"], disputeHistory: [] },
  { id: "usr_client_2", name: "Nora Smith", email: "nora@example.com", role: "client", status: "suspended", joinedAt: "2026-03-04T15:45:00.000Z", trustScore: 44, activeJobs: ["job_103"], disputeHistory: ["dsp_302"] }
];

const flaggedJobs = [
  { id: "job_103", title: "Crypto wallet recovery assistant", ownerId: "usr_client_2", status: "flagged", reason: "Automated policy check: suspicious payment wording", reportCount: 3, flaggedAt: "2026-05-21T11:00:00.000Z" },
  { id: "job_104", title: "Landing page redesign", ownerId: "usr_client_1", status: "under_review", reason: "User report: unclear scope", reportCount: 1, flaggedAt: "2026-05-22T16:20:00.000Z" }
];

const disputes = [
  { id: "dsp_301", clientId: "usr_client_1", freelancerId: "usr_freelancer_1", status: "open", transactionId: "pay_701", amount: 1200, thread: ["Client says milestone was incomplete.", "Freelancer provided delivery notes."], evidence: ["milestone-delivery.pdf", "client-feedback.txt"] },
  { id: "dsp_302", clientId: "usr_client_2", freelancerId: "usr_freelancer_1", status: "under_review", transactionId: "pay_702", amount: 350, thread: ["Refund requested after accepted delivery."], evidence: ["invoice.pdf"] }
];

const notifications = [];
const auditLog = [];
const platformSettings = { registrationsEnabled: true, jobPostingEnabled: true };

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: 2,
    openDisputes: disputes.filter(dispute => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter(job => job.status !== "approved").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: {
      high: users.filter(user => user.trustScore >= 80).length,
      medium: users.filter(user => user.trustScore >= 50 && user.trustScore < 80).length,
      low: users.filter(user => user.trustScore < 50).length
    }
  };
}

export async function getUsers(query = {}) {
  return paginate(filterUsers(users, query), query);
}

export async function getUserDetail(id) {
  const user = findById(users, id, "User");
  return { ...user, profile: { activeJobs: user.activeJobs, disputeHistory: user.disputeHistory } };
}

export async function applyUserAction(id, payload, admin) {
  const user = findById(users, id, "User");
  const action = payload.action;
  if (!["suspend", "reinstate", "ban"].includes(action)) throw httpError("Unsupported user action", 400);
  user.status = action === "reinstate" ? "active" : action === "ban" ? "banned" : "suspended";
  appendAudit(admin, `user.${action}`, { userId: id, reason: payload.reason ?? null });
  return user;
}

export async function getFlaggedJobs(query = {}) {
  return paginate(flaggedJobs, query);
}

export async function applyJobModerationAction(id, payload, admin) {
  const job = findById(flaggedJobs, id, "Flagged job");
  const action = payload.action;
  if (!["approve", "reject", "escalate"].includes(action)) throw httpError("Unsupported moderation action", 400);
  job.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  if (action === "reject") {
    notifications.push({ id: `ntf_${Date.now()}`, userId: job.ownerId, type: "job_rejected", message: payload.reason ?? "Your listing was rejected by moderation.", read: false });
  }
  appendAudit(admin, `job.${action}`, { jobId: id, reason: payload.reason ?? null });
  return job;
}

export async function getDisputes(query = {}) {
  const filtered = query.status ? disputes.filter(dispute => dispute.status === query.status) : disputes;
  return paginate(filtered, query);
}

export async function applyDisputeAction(id, payload, admin) {
  const dispute = findById(disputes, id, "Dispute");
  const action = payload.action;
  if (!["rule_for_client", "rule_for_freelancer", "refund", "escalate"].includes(action)) throw httpError("Unsupported dispute action", 400);
  dispute.status = action === "escalate" ? "under_review" : "resolved";
  dispute.ruling = action;
  dispute.rulingReason = payload.reason ?? null;
  notifications.push(
    { id: `ntf_${Date.now()}_client`, userId: dispute.clientId, type: "dispute_update", message: `Dispute ${id} updated: ${action}`, read: false },
    { id: `ntf_${Date.now()}_freelancer`, userId: dispute.freelancerId, type: "dispute_update", message: `Dispute ${id} updated: ${action}`, read: false }
  );
  appendAudit(admin, `dispute.${action}`, { disputeId: id, reason: payload.reason ?? null });
  return dispute;
}

export async function getPlatformSettings() {
  return platformSettings;
}

export async function applyPlatformSettings(payload, admin) {
  Object.assign(platformSettings, {
    registrationsEnabled: Boolean(payload.registrationsEnabled),
    jobPostingEnabled: Boolean(payload.jobPostingEnabled)
  });
  appendAudit(admin, "platform.settings_update", { ...platformSettings });
  return platformSettings;
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog.filter(entry => {
    if (query.adminId && entry.adminId !== query.adminId) return false;
    if (query.actionType && entry.actionType !== query.actionType) return false;
    if (query.from && entry.createdAt < query.from) return false;
    if (query.to && entry.createdAt > query.to) return false;
    return true;
  });
  return paginate(filtered, query);
}

function filterUsers(items, query) {
  return items.filter(user => {
    const search = String(query.search ?? "").toLowerCase();
    if (search && !`${user.name} ${user.email}`.toLowerCase().includes(search)) return false;
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    if (query.joinedFrom && user.joinedAt < query.joinedFrom) return false;
    if (query.joinedTo && user.joinedAt > query.joinedTo) return false;
    return true;
  });
}

function paginate(items, query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length, totalPages: Math.max(Math.ceil(items.length / pageSize), 1) };
}

function findById(items, id, label) {
  const item = items.find(candidate => candidate.id === id);
  if (!item) throw httpError(`${label} not found`, 404);
  return item;
}

function appendAudit(admin, actionType, details) {
  auditLog.push({ id: `aud_${Date.now()}_${auditLog.length + 1}`, adminId: admin.sub, actionType, details, createdAt: new Date().toISOString() });
}

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}
