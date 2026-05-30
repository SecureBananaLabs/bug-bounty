// Audit log — append-only, held in memory
const auditLog = [];
let nextAuditId = 1;

// Platform toggles
const platformSettings = {
  registrationsOpen: true,
  jobPostingOpen: true,
};

// In-memory store for disputes, flagged items, user overrides
const disputes = [];
let nextDisputeId = 1;

const userOverrides = {};  // { userId: { suspended: bool, banned: bool } }

export function getAuditLog(filters = {}) {
  let entries = [...auditLog];
  if (filters.admin) {
    entries = entries.filter(e => e.adminId === filters.admin);
  }
  if (filters.action) {
    entries = entries.filter(e => e.action === filters.action);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    entries = entries.filter(e => new Date(e.timestamp) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    entries = entries.filter(e => new Date(e.timestamp) <= to);
  }
  // Paginate
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const start = (page - 1) * limit;
  return {
    entries: entries.slice(start, start + limit),
    total: entries.length,
    page,
    totalPages: Math.ceil(entries.length / limit),
  };
}

function appendAudit(action, adminId, details) {
  const entry = {
    id: `audit_${nextAuditId++}`,
    timestamp: new Date().toISOString(),
    action,
    adminId,
    details,
  };
  auditLog.push(entry);
  return entry;
}

// ─── Metrics ───────────────────────────────────────────────

export async function getAdminMetrics() {
  // Dynamic imports to avoid circular deps
  const { listUsers } = await import("../services/userService.js");
  const { listJobs } = await import("../services/jobService.js");
  const { listReviews } = await import("../services/reviewService.js");
  const { listNotifications } = await import("../services/notificationService.js");

  const users = await listUsers();
  const jobs = await listJobs();
  const reviews = await listReviews();
  const notifications = await listNotifications();

  const totalUsers = users.length;
  const activeFreelancers = users.filter(u => u.role === "freelancer" && !userOverrides[u.id]?.banned && !userOverrides[u.id]?.suspended).length;
  const openJobs = jobs.filter(j => j.status === "open").length;
  const activeJobs = jobs.filter(j => j.status !== "completed" && j.status !== "cancelled").length;
  const flaggedAccounts = users.filter(u => userOverrides[u.id]?.suspended || false).length;
  const pendingDisputes = disputes.filter(d => d.status === "open" || d.status === "under_review").length;
  const newToday = users.filter(u => {
    const d = new Date(u.joined || u.createdAt || Date.now());
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const monthlyVolume = jobs.reduce((sum, j) => sum + (parseInt(j.budget) || 0), 0);

  return {
    totalUsers,
    activeFreelancers,
    openJobs,
    activeJobs,
    monthlyVolume: `$${monthlyVolume.toLocaleString()}`,
    flaggedAccounts,
    pendingDisputes,
    newToday,
    totalReviews: reviews.length,
    unreadNotifications: notifications.filter(n => !n.read).length,
  };
}

// ─── User Management ───────────────────────────────────────

export async function getAdminUsers(filters = {}) {
  const { listUsers } = await import("../services/userService.js");
  let users = await listUsers();

  // Apply overrides
  users = users.map(u => ({
    ...u,
    adminStatus: userOverrides[u.id]?.banned ? "banned" :
                  userOverrides[u.id]?.suspended ? "suspended" : "active",
  }));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    users = users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  }
  if (filters.role) {
    users = users.filter(u => u.role === filters.role);
  }
  if (filters.status) {
    users = users.filter(u => u.adminStatus === filters.status);
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const start = (page - 1) * limit;

  return {
    users: users.slice(start, start + limit),
    total: users.length,
    page,
    totalPages: Math.ceil(users.length / limit),
  };
}

export function suspendUser(adminId, userId) {
  userOverrides[userId] = { ...userOverrides[userId], suspended: true, banned: false };
  appendAudit("user_suspend", adminId, { userId });
  return { success: true, userId, status: "suspended" };
}

export function reinstateUser(adminId, userId) {
  if (userOverrides[userId]) {
    userOverrides[userId].suspended = false;
  }
  appendAudit("user_reinstate", adminId, { userId });
  return { success: true, userId, status: "active" };
}

export function banUser(adminId, userId) {
  userOverrides[userId] = { ...userOverrides[userId], banned: true, suspended: false };
  appendAudit("user_ban", adminId, { userId });
  return { success: true, userId, status: "banned" };
}

// ─── Job Moderation ────────────────────────────────────────

export async function getAdminJobs(filters = {}) {
  const { listJobs } = await import("../services/jobService.js");
  let jobs = await listJobs();

  if (filters.search) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.id?.toLowerCase().includes(q)
    );
  }
  if (filters.status) {
    jobs = jobs.filter(j => j.status === filters.status);
  }
  if (filters.flagged) {
    jobs = jobs.filter(j => j.status === "flagged" || j.status === "disputed");
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const start = (page - 1) * limit;

  return {
    jobs: jobs.slice(start, start + limit),
    total: jobs.length,
    page,
    totalPages: Math.ceil(jobs.length / limit),
  };
}

export async function approveJob(adminId, jobId) {
  const { listJobs } = await import("../services/jobService.js");
  const jobs = await listJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = "open";
  appendAudit("job_approve", adminId, { jobId });
  return { success: true, jobId, status: "open" };
}

export async function rejectJob(adminId, jobId, reason) {
  const { listJobs } = await import("../services/jobService.js");
  const { createNotification } = await import("../services/notificationService.js");
  const jobs = await listJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = "rejected";
  // Notify poster
  createNotification({
    userId: job.postedBy || job.userId || "unknown",
    title: "Listing Rejected",
    message: `Your listing "${job.title}" was rejected. Reason: ${reason || "Violates platform policy"}`,
  });
  appendAudit("job_reject", adminId, { jobId, reason });
  return { success: true, jobId, status: "rejected" };
}

export async function escalateJob(adminId, jobId) {
  const { listJobs } = await import("../services/jobService.js");
  const jobs = await listJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = "escalated";
  appendAudit("job_escalate", adminId, { jobId });
  return { success: true, jobId, status: "escalated" };
}

// ─── Dispute Resolution ────────────────────────────────────

export function getDisputes(filters = {}) {
  let result = [...disputes];
  if (filters.status) {
    result = result.filter(d => d.status === filters.status);
  }
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const start = (page - 1) * limit;
  return {
    disputes: result.slice(start, start + limit),
    total: result.length,
    page,
    totalPages: Math.ceil(result.length / limit),
  };
}

export async function createDispute(adminId, jobId, reason) {
  const { listJobs } = await import("../services/jobService.js");
  const jobs = await listJobs();
  const job = jobs.find(j => j.id === jobId);
  const dispute = {
    id: `disp_${nextDisputeId++}`,
    jobId,
    jobTitle: job?.title || "Unknown Job",
    status: "open",
    reason: reason || "Dispute filed",
    openedBy: adminId,
    openedAt: new Date().toISOString(),
    evidence: [],
    thread: [],
    resolution: null,
  };
  disputes.push(dispute);
  appendAudit("dispute_create", adminId, { jobId, disputeId: dispute.id });
  return dispute;
}

export async function resolveDispute(adminId, disputeId, ruling) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.resolution = {
    ruling: ruling.favor,  // "freelancer" | "client" | "split"
    refund: ruling.refund || false,
    resolvedBy: adminId,
    resolvedAt: new Date().toISOString(),
    notes: ruling.notes || "",
  };
  // Notify both parties
  const { createNotification } = await import("../services/notificationService.js");
  createNotification({
    title: "Dispute Resolved",
    message: `Dispute #${disputeId} has been resolved. Ruling: ${ruling.favor}`,
  });
  appendAudit("dispute_resolve", adminId, { disputeId, ruling: ruling.favor });
  return dispute;
}

export async function escalateDispute(adminId, disputeId) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "escalated";
  appendAudit("dispute_escalate", adminId, { disputeId });
  return dispute;
}

export function addDisputeNote(adminId, disputeId, note) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.thread.push({
    author: adminId,
    message: note,
    timestamp: new Date().toISOString(),
  });
  return dispute;
}

// ─── Platform Controls ─────────────────────────────────────

export function getPlatformSettings() {
  return { ...platformSettings };
}

export function toggleRegistration(adminId) {
  platformSettings.registrationsOpen = !platformSettings.registrationsOpen;
  appendAudit("toggle_registrations", adminId, { now: platformSettings.registrationsOpen });
  return { registrationsOpen: platformSettings.registrationsOpen };
}

export function toggleJobPosting(adminId) {
  platformSettings.jobPostingOpen = !platformSettings.jobPostingOpen;
  appendAudit("toggle_job_posting", adminId, { now: platformSettings.jobPostingOpen });
  return { jobPostingOpen: platformSettings.jobPostingOpen };
}
