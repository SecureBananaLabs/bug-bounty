/**
 * Admin service — business logic for platform administration.
 * Handles users, jobs, disputes, metrics, platform controls, and audit logging.
 */

// --- In-memory data stores (placeholder until Prisma integration) ---

const users = [
  { id: "u1", email: "alice@test.com", name: "Alice Chen", role: "freelancer", status: "active", joinedAt: "2026-01-15", trustScore: 92, activeJobs: 3, disputes: 0 },
  { id: "u2", email: "bob@test.com", name: "Bob Garcia", role: "client", status: "active", joinedAt: "2026-02-20", trustScore: 88, activeJobs: 5, disputes: 1 },
  { id: "u3", email: "carol@test.com", name: "Carol Lee", role: "freelancer", status: "suspended", joinedAt: "2026-03-10", trustScore: 45, activeJobs: 0, disputes: 3 },
  { id: "u4", email: "dave@test.com", name: "Dave Kim", role: "client", status: "active", joinedAt: "2026-04-05", trustScore: 95, activeJobs: 2, disputes: 0 },
  { id: "u5", email: "eve@test.com", name: "Eve Park", role: "freelancer", status: "banned", joinedAt: "2026-05-01", trustScore: 12, activeJobs: 0, disputes: 5 },
];

const flaggedJobs = [
  { id: "j1", title: "Build a crypto wallet", postedBy: "u2", flaggedAt: "2026-07-15", reason: "Potential scam", status: "pending" },
  { id: "j2", title: "Data entry — 10k records", postedBy: "u4", flaggedAt: "2026-07-16", reason: "User report: unrealistic budget", status: "pending" },
  { id: "j3", title: "Logo design for startup", postedBy: "u2", flaggedAt: "2026-07-17", reason: "Automated: duplicate posting", status: "pending" },
];

const disputes = [
  { id: "d1", freelancerId: "u1", clientId: "u2", jobId: "j1", status: "open", openedAt: "2026-07-10", description: "Freelancer claims work was delivered, client disputes quality.", evidence: ["screenshot1.png", "contract.pdf"], transactionAmount: 500 },
  { id: "d2", freelancerId: "u3", clientId: "u4", jobId: "j2", status: "under_review", openedAt: "2026-07-12", description: "Payment dispute — freelancer says invoice was paid late.", evidence: ["invoice.pdf"], transactionAmount: 1200 },
  { id: "d3", freelancerId: "u5", clientId: "u2", jobId: "j1", status: "open", openedAt: "2026-07-14", description: "Client requests refund for incomplete deliverable.", evidence: [], transactionAmount: 800 },
];

const auditLog = [
  { id: "a1", adminId: "admin1", action: "suspend_user", targetId: "u3", timestamp: "2026-07-14T10:30:00Z", details: "Repeated dispute violations" },
  { id: "a2", adminId: "admin1", action: "ban_user", targetId: "u5", timestamp: "2026-07-15T14:20:00Z", details: "Scam activity detected" },
  { id: "a3", adminId: "admin1", action: "reject_listing", targetId: "j3", timestamp: "2026-07-17T09:15:00Z", details: "Duplicate posting" },
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};

// --- Helper functions ---

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function writeAudit(adminId, action, targetId, details) {
  auditLog.unshift({
    id: generateId("a"),
    adminId,
    action,
    targetId,
    timestamp: new Date().toISOString(),
    details: details || "",
  });
}

// --- User Management ---

/**
 * List all users with optional filtering and pagination.
 * @param {object} opts - Filter and pagination options
 * @param {string} opts.role - Filter by role (freelancer/client)
 * @param {string} opts.status - Filter by status (active/suspended/banned)
 * @param {number} opts.page - Page number (1-based)
 * @param {number} opts.limit - Items per page
 * @returns {Promise<{items: array, total: number, page: number, limit: number}>}
 */
export async function listUsers(opts = {}) {
  const { role, status, page = 1, limit = 20 } = opts;
  let filtered = users;

  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { items, total, page, limit };
}

/**
 * Get a single user with their active jobs and dispute history.
 * @param {string} userId - The user ID to look up.
 * @returns {Promise<object|null>} User with related data, or null if not found.
 */
export async function getUserDetail(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const userDisputes = disputes.filter(
    (d) => d.freelancerId === userId || d.clientId === userId
  );

  return {
    ...user,
    activeJobs: user.activeJobs,
    disputeHistory: userDisputes,
  };
}

/**
 * Suspend a user account.
 * @param {string} userId - The user ID to suspend.
 * @param {string} adminId - The admin performing the action.
 * @param {string} reason - Reason for suspension.
 * @returns {Promise<object>} The updated user.
 * @throws {Error} If user not found or already suspended/banned.
 */
export async function suspendUser(userId, adminId, reason) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  if (user.status === "suspended") throw new Error("User is already suspended");
  if (user.status === "banned") throw new Error("Cannot suspend a banned user");

  user.status = "suspended";
  writeAudit(adminId, "suspend_user", userId, reason);
  return user;
}

/**
 * Reinstate a suspended user account.
 * @param {string} userId - The user ID to reinstate.
 * @param {string} adminId - The admin performing the action.
 * @returns {Promise<object>} The updated user.
 * @throws {Error} If user not found or not suspended.
 */
export async function reinstateUser(userId, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  if (user.status !== "suspended") throw new Error("User is not suspended");

  user.status = "active";
  writeAudit(adminId, "reinstate_user", userId, "");
  return user;
}

/**
 * Permanently ban a user account.
 * @param {string} userId - The user ID to ban.
 * @param {string} adminId - The admin performing the action.
 * @param {string} reason - Reason for ban.
 * @returns {Promise<object>} The updated user.
 * @throws {Error} If user not found or already banned.
 */
export async function banUser(userId, adminId, reason) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  if (user.status === "banned") throw new Error("User is already banned");

  user.status = "banned";
  writeAudit(adminId, "ban_user", userId, reason);
  return user;
}

// --- Job & Listing Moderation ---

/**
 * List flagged jobs in the moderation queue.
 * @param {object} opts - Pagination options.
 * @returns {Promise<{items: array, total: number, page: number, limit: number}>}
 */
export async function listFlaggedJobs(opts = {}) {
  const { status, page = 1, limit = 20 } = opts;
  let filtered = flaggedJobs;
  if (status) filtered = filtered.filter((j) => j.status === status);

  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, limit };
}

/**
 * Approve a flagged listing.
 * @param {string} jobId - The flagged job ID.
 * @param {string} adminId - The admin performing the action.
 * @returns {Promise<object>} The updated job.
 * @throws {Error} If job not found.
 */
export async function approveJob(jobId, adminId) {
  const job = flaggedJobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");

  job.status = "approved";
  writeAudit(adminId, "approve_listing", jobId, "");
  return job;
}

/**
 * Reject a flagged listing and notify the poster.
 * @param {string} jobId - The flagged job ID.
 * @param {string} adminId - The admin performing the action.
 * @param {string} reason - Rejection reason (sent to poster).
 * @returns {Promise<object>} The updated job with notification info.
 * @throws {Error} If job not found.
 */
export async function rejectJob(jobId, adminId, reason) {
  const job = flaggedJobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");

  job.status = "rejected";
  writeAudit(adminId, "reject_listing", jobId, reason);
  return { ...job, notification: { recipientId: job.postedBy, reason } };
}

/**
 * Escalate a flagged listing for senior review.
 * @param {string} jobId - The flagged job ID.
 * @param {string} adminId - The admin performing the action.
 * @returns {Promise<object>} The updated job.
 * @throws {Error} If job not found.
 */
export async function escalateJob(jobId, adminId) {
  const job = flaggedJobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");

  job.status = "escalated";
  writeAudit(adminId, "escalate_listing", jobId, "");
  return job;
}

// --- Dispute Resolution ---

/**
 * List disputes with optional status filter and pagination.
 * @param {object} opts - Filter and pagination options.
 * @returns {Promise<{items: array, total: number, page: number, limit: number}>}
 */
export async function listDisputes(opts = {}) {
  const { status, page = 1, limit = 20 } = opts;
  let filtered = disputes;
  if (status) filtered = filtered.filter((d) => d.status === status);

  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, limit };
}

/**
 * Get full dispute details including thread, evidence, and transaction.
 * @param {string} disputeId - The dispute ID.
 * @returns {Promise<object|null>} Dispute details or null if not found.
 */
export async function getDisputeDetail(disputeId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return null;

  const freelancer = users.find((u) => u.id === dispute.freelancerId);
  const client = users.find((u) => u.id === dispute.clientId);

  return {
    ...dispute,
    freelancer: freelancer ? { id: freelancer.id, name: freelancer.name, email: freelancer.email } : null,
    client: client ? { id: client.id, name: client.name, email: client.email } : null,
  };
}

/**
 * Rule on a dispute in favor of one party.
 * @param {string} disputeId - The dispute ID.
 * @param {string} adminId - The admin making the ruling.
 * @param {string} ruling - "freelancer" or "client".
 * @param {boolean} triggerRefund - Whether to trigger a refund.
 * @returns {Promise<object>} The updated dispute with notification info.
 * @throws {Error} If dispute not found or already resolved.
 */
export async function resolveDispute(disputeId, adminId, ruling, triggerRefund) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  if (dispute.status === "resolved") throw new Error("Dispute is already resolved");

  dispute.status = "resolved";
  dispute.resolution = {
    ruling,
    refundTriggered: triggerRefund,
    resolvedBy: adminId,
    resolvedAt: new Date().toISOString(),
  };

  writeAudit(adminId, "dispute_ruling", disputeId, `Ruled in favor of ${ruling}. Refund: ${triggerRefund}`);

  return {
    ...dispute,
    notifications: [
      { recipientId: dispute.freelancerId, message: `Dispute ${disputeId} resolved: ruled in favor of ${ruling}` },
      { recipientId: dispute.clientId, message: `Dispute ${disputeId} resolved: ruled in favor of ${ruling}` },
    ],
  };
}

/**
 * Escalate a dispute to senior admin.
 * @param {string} disputeId - The dispute ID.
 * @param {string} adminId - The admin escalating.
 * @returns {Promise<object>} The updated dispute.
 * @throws {Error} If dispute not found.
 */
export async function escalateDispute(disputeId, adminId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");

  dispute.status = "escalated";
  writeAudit(adminId, "escalate_dispute", disputeId, "");
  return dispute;
}

// --- Trust & Metrics Dashboard ---

/**
 * Get platform metrics for the admin dashboard.
 * @returns {Promise<object>} Summary cards data.
 */
export async function getAdminMetrics() {
  const totalUsers = users.length;
  const activeJobs = users.reduce((sum, u) => sum + (u.activeJobs || 0), 0);
  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;
  const flaggedListings = flaggedJobs.filter((j) => j.status === "pending").length;
  const revenue = 128900;

  const trustBuckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  for (const u of users) {
    if (u.trustScore <= 25) trustBuckets["0-25"]++;
    else if (u.trustScore <= 50) trustBuckets["26-50"]++;
    else if (u.trustScore <= 75) trustBuckets["51-75"]++;
    else trustBuckets["76-100"]++;
  }

  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenue,
    trustScoreDistribution: trustBuckets,
  };
}

// --- Platform Controls ---

/**
 * Get current platform control settings.
 * @returns {Promise<object>} Platform control toggles.
 */
export async function getPlatformControls() {
  return { ...platformControls };
}

/**
 * Toggle a platform control setting.
 * @param {string} key - The control key.
 * @param {boolean} value - The new value.
 * @param {string} adminId - The admin making the change.
 * @returns {Promise<object>} Updated platform controls.
 * @throws {Error} If the control key is invalid.
 */
export async function togglePlatformControl(key, value, adminId) {
  if (!(key in platformControls)) {
    throw new Error(`Invalid platform control: ${key}`);
  }

  platformControls[key] = value;
  writeAudit(adminId, "toggle_control", key, `Set to ${value}`);
  return { ...platformControls };
}

// --- Audit Log ---

/**
 * List audit log entries with filtering and pagination.
 * @param {object} opts - Filter and pagination options.
 * @returns {Promise<{items: array, total: number, page: number, limit: number}>}
 */
export async function listAuditLog(opts = {}) {
  const { adminId, action, dateFrom, dateTo, page = 1, limit = 50 } = opts;
  let filtered = auditLog;

  if (adminId) filtered = filtered.filter((a) => a.adminId === adminId);
  if (action) filtered = filtered.filter((a) => a.action === action);
  if (dateFrom) filtered = filtered.filter((a) => a.timestamp >= dateFrom);
  if (dateTo) filtered = filtered.filter((a) => a.timestamp <= dateTo);

  const total = filtered.length;
  const start = (page - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page, limit };
}
