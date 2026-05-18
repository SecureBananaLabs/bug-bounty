// ---------------------------------------------------------------------------
// In-memory admin service — all data is ephemeral (matches existing service
// pattern).  In production this would use Prisma / the real DB.
// ---------------------------------------------------------------------------

// ── In-memory stores ────────────────────────────────────────────────────────
const users = [
  { id: "usr_1", email: "alice@test.com",      name: "Alice Johnson",  role: "client",     status: "active",    createdAt: "2025-01-15T08:00:00Z" },
  { id: "usr_2", email: "bob@test.com",        name: "Bob Smith",      role: "freelancer",  status: "active",    createdAt: "2025-02-20T10:30:00Z" },
  { id: "usr_3", email: "carol@test.com",      name: "Carol Davis",    role: "client",     status: "active",    createdAt: "2025-03-10T14:15:00Z" },
  { id: "usr_4", email: "dave@test.com",       name: "Dave Wilson",    role: "freelancer",  status: "suspended", createdAt: "2025-03-12T09:00:00Z" },
  { id: "usr_5", email: "eve@test.com",        name: "Eve Martin",     role: "freelancer",  status: "active",    createdAt: "2025-04-01T12:00:00Z" },
  { id: "usr_6", email: "frank@test.com",      name: "Frank Lee",      role: "client",     status: "banned",    createdAt: "2025-04-05T16:45:00Z" },
  { id: "usr_7", email: "grace@test.com",      name: "Grace Kim",      role: "freelancer",  status: "active",    createdAt: "2025-05-01T07:30:00Z" },
  { id: "usr_8", email: "henry@test.com",      name: "Henry Brown",    role: "client",     status: "active",    createdAt: "2025-05-12T11:20:00Z" },
  { id: "usr_9", email: "admin@test.com",      name: "Admin User",     role: "admin",      status: "active",    createdAt: "2025-01-01T00:00:00Z" },
];

const flaggedJobs = [
  {
    id: "job_1",
    userId: "usr_1",
    title: "Build a crypto exchange",
    description: "Need someone to build a full crypto exchange platform. Must support all coins.",
    budgetMin: 5000,
    budgetMax: 15000,
    status: "flagged",
    categoryId: "cat_1",
    skills: ["blockchain", "solidity", "react"],
    flaggedReason: "Possibly prohibited financial service",
    flaggedBy: "system",
    flaggedAt: "2025-05-14T10:00:00Z",
    moderationStatus: "pending",
    createdAt: "2025-05-14T08:00:00Z"
  },
  {
    id: "job_2",
    userId: "usr_3",
    title: "Write my university thesis",
    description: "Need someone to complete my computer science thesis. 50 pages, deadline next week.",
    budgetMin: 200,
    budgetMax: 500,
    status: "flagged",
    categoryId: "cat_2",
    skills: ["writing", "research"],
    flaggedReason: "Academic dishonesty policy violation",
    flaggedBy: "system",
    flaggedAt: "2025-05-15T09:00:00Z",
    moderationStatus: "pending",
    createdAt: "2025-05-15T07:00:00Z"
  },
  {
    id: "job_3",
    userId: "usr_5",
    title: "Mature content moderation",
    description: "Need moderators for adult content platform. Must be 18+.",
    budgetMin: 1000,
    budgetMax: 3000,
    status: "flagged",
    categoryId: "cat_3",
    skills: ["moderation"],
    flaggedReason: "Adult content flagged for review",
    flaggedBy: "system",
    flaggedAt: "2025-05-16T11:30:00Z",
    moderationStatus: "pending",
    createdAt: "2025-05-16T10:00:00Z"
  }
];

// ── Jobs store (for all jobs, not just flagged) ────────────────────────────
const allJobs = [
  { id: "job_4",  userId: "usr_1", title: "React Dashboard",      description: "Build admin dashboard",           budgetMin: 1000, budgetMax: 3000,  status: "open",      categoryId: "cat_1", skills: ["react", "node"],         createdAt: "2025-04-10T08:00:00Z" },
  { id: "job_5",  userId: "usr_3", title: "Logo Design",          description: "Need a modern logo",               budgetMin: 200,  budgetMax: 500,  status: "in_progress", categoryId: "cat_2", skills: ["design", "illustrator"], createdAt: "2025-04-15T09:00:00Z" },
  { id: "job_6",  userId: "usr_8", title: "API Integration",      description: "Integrate Stripe API",             budgetMin: 1500, budgetMax: 4000, status: "completed",  categoryId: "cat_1", skills: ["node", "stripe"],          createdAt: "2025-03-20T10:00:00Z" },
  { id: "job_7",  userId: "usr_1", title: "Mobile App UI",        description: "Figma to React Native",            budgetMin: 3000, budgetMax: 8000, status: "open",      categoryId: "cat_1", skills: ["react-native", "figma"],   createdAt: "2025-05-01T07:00:00Z" },
];

const disputes = [
  {
    id: "disp_1",
    jobId: "job_5",
    raisedBy: "usr_3",
    raisedAgainst: "usr_5",
    reason: "Freelancer did not deliver on time and submitted incomplete work",
    evidence: "Chat logs show missed deadlines, partial deliverables attached.",
    status: "open",
    ruling: null,
    ruledBy: null,
    createdAt: "2025-05-10T14:00:00Z"
  },
  {
    id: "disp_2",
    jobId: "job_6",
    raisedBy: "usr_5",
    raisedAgainst: "usr_8",
    reason: "Client refuses to pay after work was completed and approved",
    evidence: "Screenshots of approval messages and invoice.",
    status: "under_review",
    ruling: null,
    ruledBy: null,
    createdAt: "2025-05-12T09:30:00Z"
  },
  {
    id: "disp_3",
    jobId: "job_4",
    raisedBy: "usr_1",
    raisedAgainst: "usr_2",
    reason: "Quality of work does not match the agreed specifications",
    evidence: "Spec document vs delivered work comparison.",
    status: "open",
    ruling: null,
    ruledBy: null,
    createdAt: "2025-05-13T11:00:00Z"
  }
];

// ── Platform controls ───────────────────────────────────────────────────────
let platformControls = {
  registrationsOpen: true,
  jobPostingsOpen: true
};

// ── Audit log (append-only) ─────────────────────────────────────────────────
const auditLog = [
  { id: "audit_1", adminId: "usr_9", adminName: "Admin User", action: "login",            target: "system",   details: "Admin logged in",                     createdAt: "2025-05-15T00:00:00Z" },
  { id: "audit_2", adminId: "usr_9", adminName: "Admin User", action: "update_controls",  target: "system",   details: "Disabled new registrations",          createdAt: "2025-05-15T01:00:00Z" },
  { id: "audit_3", adminId: "usr_9", adminName: "Admin User", action: "update_user_status", target: "usr_4", details: "Suspended user usr_4 (Dave Wilson)",   createdAt: "2025-05-15T02:00:00Z" },
];

let auditCounter = auditLog.length;

// ── Helpers ─────────────────────────────────────────────────────────────────
function addAuditEntry(adminId, adminName, action, target, details) {
  auditCounter++;
  const entry = {
    id: `audit_${auditCounter}`,
    adminId,
    adminName,
    action,
    target,
    details,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(entry);  // newest first
  return entry;
}

function paginate(arr, page = 1, limit = 20) {
  const total = arr.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = arr.slice(start, start + limit);
  return { items, total, page, limit, totalPages };
}

function getTimestamp() {
  return new Date().toISOString();
}

// ── Dashboard / Metrics ─────────────────────────────────────────────────────
export async function getAdminMetrics() {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const suspendedUsers = users.filter(u => u.status === "suspended").length;
  const bannedUsers = users.filter(u => u.status === "banned").length;
  const totalJobs = allJobs.length + flaggedJobs.length;
  const activeJobs = allJobs.filter(j => j.status === "open" || j.status === "in_progress").length;
  const completedJobs = allJobs.filter(j => j.status === "completed").length;
  const openDisputes = disputes.filter(d => d.status === "open").length;
  const pendingFlagged = flaggedJobs.filter(j => j.moderationStatus === "pending").length;
  const totalDisputes = disputes.length;

  // Mock revenue calculation
  const totalRevenue = allJobs
    .filter(j => j.status === "completed")
    .reduce((sum, j) => sum + (j.budgetMin + j.budgetMax) / 2, 0);

  // Trust score (simulated)
  const trustScore = Math.round(
    ((activeUsers / Math.max(totalUsers, 1)) * 40) +
    ((completedJobs / Math.max(totalJobs, 1)) * 30) +
    ((1 - openDisputes / Math.max(totalDisputes, 1)) * 30)
  );

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    totalJobs,
    activeJobs,
    completedJobs,
    openDisputes,
    pendingFlagged,
    totalRevenue: Math.round(totalRevenue),
    trustScore: Math.max(0, Math.min(100, trustScore)),
    // Historical trust scores for chart (last 7 days)
    trustScoreHistory: [
      { date: "2025-05-13", score: 72 },
      { date: "2025-05-14", score: 75 },
      { date: "2025-05-15", score: 73 },
      { date: "2025-05-16", score: 78 },
      { date: "2025-05-17", score: 76 },
      { date: "2025-05-18", score: 80 },
      { date: "2025-05-19", score: trustScore }
    ]
  };
}

// ── User Management ─────────────────────────────────────────────────────────
export async function listUsers(query = {}) {
  let filtered = [...users];

  if (query.role) {
    filtered = filtered.filter(u => u.role === query.role);
  }
  if (query.status) {
    filtered = filtered.filter(u => u.status === query.status);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return paginate(filtered, query.page, query.limit);
}

export async function getUserById(id) {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  const userJobs = [...allJobs, ...flaggedJobs].filter(j => j.userId === id);
  const userDisputes = disputes.filter(d => d.raisedBy === id || d.raisedAgainst === id);

  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function updateUserStatus(adminId, adminName, userId, newStatus, reason) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const oldStatus = user.status;
  user.status = newStatus;

  addAuditEntry(
    adminId,
    adminName,
    "update_user_status",
    userId,
    `Changed status from ${oldStatus} to ${newStatus}${reason ? `: ${reason}` : ""}`
  );

  return { ...user };
}

// ── Job / Listing Moderation ────────────────────────────────────────────────
export async function listFlaggedJobs(query = {}) {
  let filtered = [...flaggedJobs];

  if (query.moderationStatus) {
    filtered = filtered.filter(j => j.moderationStatus === query.moderationStatus);
  }

  filtered.sort((a, b) => new Date(b.flaggedAt) - new Date(a.flaggedAt));
  return paginate(filtered, query.page, query.limit);
}

export async function moderateJob(adminId, adminName, jobId, action, reason) {
  const job = flaggedJobs.find(j => j.id === jobId);
  if (!job) return { error: "Flagged job not found" };

  job.moderationStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
  job.moderatedBy = adminId;
  job.moderatedAt = getTimestamp();
  job.moderationReason = reason || null;

  // Update status in allJobs if the job is there
  const mainJob = allJobs.find(j => j.id === jobId);
  if (mainJob) {
    mainJob.status = action === "approve" ? "open" : "cancelled";
  }

  addAuditEntry(
    adminId,
    adminName,
    "moderate_job",
    jobId,
    `${action}d flagged job "${job.title}"${reason ? `: ${reason}` : ""}`
  );

  return {
    ...job,
    notification: action === "reject"
      ? { to: job.userId, message: `Your job "${job.title}" was rejected. Reason: ${reason || "Policy violation"}` }
      : undefined
  };
}

// ── Dispute Resolution ──────────────────────────────────────────────────────
export async function listDisputes(query = {}) {
  let filtered = [...disputes];

  if (query.status) {
    filtered = filtered.filter(d => d.status === query.status);
  }

  // Enrich with user names
  const enriched = filtered.map(d => {
    const raiser = users.find(u => u.id === d.raisedBy);
    const opponent = users.find(u => u.id === d.raisedAgainst);
    return {
      ...d,
      raisedByName: raiser?.name || "Unknown",
      raisedAgainstName: opponent?.name || "Unknown"
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return paginate(enriched, query.page, query.limit);
}

export async function getDisputeById(id) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;

  const raiser = users.find(u => u.id === dispute.raisedBy);
  const opponent = users.find(u => u.id === dispute.raisedAgainst);
  const job = [...allJobs, ...flaggedJobs].find(j => j.id === dispute.jobId);

  return {
    ...dispute,
    raisedByName: raiser?.name || "Unknown",
    raisedAgainstName: opponent?.name || "Unknown",
    job: job || null
  };
}

export async function ruleOnDispute(adminId, adminName, disputeId, ruling, notes) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) return { error: "Dispute not found" };

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.ruledBy = adminId;
  dispute.ruledAt = getTimestamp();
  dispute.rulingNotes = notes || null;

  addAuditEntry(
    adminId,
    adminName,
    "rule_dispute",
    disputeId,
    `Ruled "${ruling}" on dispute ${disputeId}${notes ? `: ${notes}` : ""}`
  );

  return {
    ...dispute,
    notification: {
      to: [dispute.raisedBy, dispute.raisedAgainst],
      message: `Dispute ${disputeId} has been resolved. Ruling: ${ruling}.${notes ? ` Notes: ${notes}` : ""}`
    }
  };
}

// ── Platform Controls ───────────────────────────────────────────────────────
export async function getControls() {
  return { ...platformControls };
}

export async function updateControls(adminId, adminName, updates) {
  const changed = [];
  if (updates.registrationsOpen !== undefined) {
    const old = platformControls.registrationsOpen;
    platformControls.registrationsOpen = updates.registrationsOpen;
    changed.push(`registrations: ${old} → ${updates.registrationsOpen}`);
  }
  if (updates.jobPostingsOpen !== undefined) {
    const old = platformControls.jobPostingsOpen;
    platformControls.jobPostingsOpen = updates.jobPostingsOpen;
    changed.push(`jobPostings: ${old} → ${updates.jobPostingsOpen}`);
  }

  if (changed.length > 0) {
    addAuditEntry(
      adminId,
      adminName,
      "update_controls",
      "system",
      `Updated platform controls: ${changed.join(", ")}`
    );
  }

  return { ...platformControls };
}

// ── Audit Log ───────────────────────────────────────────────────────────────
export async function getAuditLog(query = {}) {
  let filtered = [...auditLog];

  if (query.adminId) {
    filtered = filtered.filter(e => e.adminId === query.adminId);
  }
  if (query.action) {
    filtered = filtered.filter(e => e.action === query.action);
  }

  return paginate(filtered, query.page, query.limit);
}
