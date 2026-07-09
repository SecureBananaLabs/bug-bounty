// ---------------------------------------------------------------------------
// Mock data store – in production this would be backed by Prisma/PostgreSQL.
// Using in-memory stores here since the DB layer (packages/db) is still a
// placeholder.  Every function mirrors the real Prisma query it would run.
// ---------------------------------------------------------------------------

const usersStore = [
  { id: "usr-1", email: "alice@example.com", fullName: "Alice Admin", role: "ADMIN", status: "ACTIVE", trustScore: 100, isVerified: true, bio: "Platform administrator", createdAt: "2025-09-01T00:00:00Z", updatedAt: "2025-09-01T00:00:00Z" },
  { id: "usr-2", email: "bob@example.com", fullName: "Bob Builder", role: "CLIENT", status: "ACTIVE", trustScore: 92, isVerified: true, bio: "Startup founder", createdAt: "2025-10-15T00:00:00Z", updatedAt: "2025-10-15T00:00:00Z" },
  { id: "usr-3", email: "carol@example.com", fullName: "Carol Coder", role: "FREELANCER", status: "ACTIVE", trustScore: 87, isVerified: true, bio: "Full-stack developer", createdAt: "2025-11-20T00:00:00Z", updatedAt: "2025-11-20T00:00:00Z" },
  { id: "usr-4", email: "dave@example.com", fullName: "Dave Designer", role: "FREELANCER", status: "SUSPENDED", trustScore: 45, isVerified: false, bio: "UI/UX designer", createdAt: "2026-01-05T00:00:00Z", updatedAt: "2026-03-10T00:00:00Z" },
  { id: "usr-5", email: "eve@example.com", fullName: "Eve Entrepreneur", role: "CLIENT", status: "ACTIVE", trustScore: 78, isVerified: true, bio: "E-commerce owner", createdAt: "2026-02-14T00:00:00Z", updatedAt: "2026-02-14T00:00:00Z" }
];

const jobsStore = [
  { id: "job-101", title: "Build an AI customer support widget", description: "Need an AI-powered widget", budgetMin: 1200, budgetMax: 1500, status: "OPEN", isFlagged: true, flagReason: "Possible spam content detected", clientId: "usr-2", createdAt: "2026-04-01T00:00:00Z" },
  { id: "job-102", title: "Migrate legacy API to Node.js", description: "Full API migration", budgetMin: 2000, budgetMax: 2800, status: "IN_PROGRESS", isFlagged: false, flagReason: null, clientId: "usr-2", createdAt: "2026-03-15T00:00:00Z" },
  { id: "job-103", title: "Design SaaS onboarding flows", description: "Create onboarding UX", budgetMin: 700, budgetMax: 900, status: "OPEN", isFlagged: true, flagReason: "Unrealistically low budget for scope", clientId: "usr-5", createdAt: "2026-04-10T00:00:00Z" },
  { id: "job-104", title: "SEO content writing batch", description: "Write 50 SEO articles", budgetMin: 300, budgetMax: 500, status: "OPEN", isFlagged: true, flagReason: "Potential content farm", clientId: "usr-5", createdAt: "2026-04-20T00:00:00Z" }
];

const disputesStore = [
  { id: "disp-1", jobId: "job-102", filerId: "usr-3", targetId: "usr-2", reason: "Non-payment", description: "Client has not released milestone payment after delivery", status: "OPEN", ruling: null, resolvedAt: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: "disp-2", jobId: "job-103", filerId: "usr-5", targetId: "usr-4", reason: "Quality issues", description: "Delivered work does not match agreed specifications", status: "UNDER_REVIEW", ruling: null, resolvedAt: null, createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-12T00:00:00Z" }
];

const auditLogsStore = [];

let platformConfig = {
  id: "config-1",
  registrationEnabled: true,
  jobPostingEnabled: true,
  updatedAt: new Date().toISOString()
};

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export async function getAdminMetrics() {
  const openJobs = jobsStore.filter((j) => j.status === "OPEN").length;
  const activeFreelancers = usersStore.filter(
    (u) => u.role === "FREELANCER" && u.status === "ACTIVE"
  ).length;
  const flaggedAccounts = usersStore.filter((u) => u.status === "SUSPENDED" || u.status === "BANNED").length;
  const totalUsers = usersStore.length;
  const openDisputes = disputesStore.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length;
  const flaggedJobs = jobsStore.filter((j) => j.isFlagged).length;
  const monthlyVolume = 128900;

  return {
    openJobs,
    activeFreelancers,
    flaggedAccounts,
    totalUsers,
    openDisputes,
    flaggedJobs,
    monthlyVolume
  };
}

// ---------------------------------------------------------------------------
// Trust-score distribution
// ---------------------------------------------------------------------------

export async function getTrustScoreDistribution() {
  const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  for (const u of usersStore) {
    const s = u.trustScore;
    if (s <= 20) buckets["0-20"]++;
    else if (s <= 40) buckets["21-40"]++;
    else if (s <= 60) buckets["41-60"]++;
    else if (s <= 80) buckets["61-80"]++;
    else buckets["81-100"]++;
  }
  return { distribution: buckets, totalUsers: usersStore.length };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUsers({ search, role, status, page, limit }) {
  let filtered = [...usersStore];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id) {
  const user = usersStore.find((u) => u.id === id);
  if (!user) return null;

  const jobs = jobsStore.filter((j) => j.clientId === id);
  const disputes = disputesStore.filter(
    (d) => d.filerId === id || d.targetId === id
  );

  return { ...user, jobs, disputes, reviews: [] };
}

export async function setUserStatus(id, newStatus, adminId) {
  const user = usersStore.find((u) => u.id === id);
  if (!user) return null;

  const oldStatus = user.status;
  user.status = newStatus;
  user.updatedAt = new Date().toISOString();

  const actionMap = {
    SUSPENDED: "USER_SUSPENDED",
    BANNED: "USER_BANNED",
    ACTIVE: "USER_REINSTATED"
  };

  auditLogsStore.push({
    id: `audit-${Date.now()}`,
    action: actionMap[newStatus],
    performedBy: adminId,
    targetId: id,
    details: `Status changed from ${oldStatus} to ${newStatus}`,
    createdAt: new Date().toISOString()
  });

  return user;
}

// ---------------------------------------------------------------------------
// Flagged jobs
// ---------------------------------------------------------------------------

export async function getFlaggedJobList() {
  return jobsStore
    .filter((j) => j.isFlagged)
    .map((j) => ({
      ...j,
      client: usersStore.find((u) => u.id === j.clientId) ?? null
    }));
}

export async function moderateJobById(id, action, adminId) {
  const job = jobsStore.find((j) => j.id === id);
  if (!job) return null;

  const actionMap = {
    approve: "JOB_APPROVED",
    reject: "JOB_REJECTED",
    escalate: "JOB_ESCALATED"
  };

  if (action === "approve") {
    job.isFlagged = false;
    job.flagReason = null;
  } else if (action === "reject") {
    job.status = "CANCELLED";
    job.isFlagged = false;
  }
  // escalate keeps isFlagged = true for higher-level review

  auditLogsStore.push({
    id: `audit-${Date.now()}`,
    action: actionMap[action],
    performedBy: adminId,
    targetId: id,
    details: `Job "${job.title}" was ${action}d`,
    createdAt: new Date().toISOString()
  });

  return job;
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export async function getDisputes({ status }) {
  let list = [...disputesStore];
  if (status) list = list.filter((d) => d.status === status);

  return list.map((d) => ({
    ...d,
    filer: usersStore.find((u) => u.id === d.filerId) ?? null,
    target: usersStore.find((u) => u.id === d.targetId) ?? null,
    job: jobsStore.find((j) => j.id === d.jobId) ?? null
  }));
}

export async function resolveDisputeById(id, ruling, adminId) {
  const dispute = disputesStore.find((d) => d.id === id);
  if (!dispute) return null;

  dispute.status = "RESOLVED";
  dispute.ruling = ruling;
  dispute.resolvedAt = new Date().toISOString();
  dispute.updatedAt = new Date().toISOString();

  auditLogsStore.push({
    id: `audit-${Date.now()}`,
    action: "DISPUTE_RESOLVED",
    performedBy: adminId,
    targetId: id,
    details: `Ruling: ${ruling}`,
    createdAt: new Date().toISOString()
  });

  return dispute;
}

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------

export async function getPlatformConfig() {
  return platformConfig;
}

export async function updatePlatformConfig(updates, adminId) {
  if (typeof updates.registrationEnabled === "boolean") {
    platformConfig.registrationEnabled = updates.registrationEnabled;
  }
  if (typeof updates.jobPostingEnabled === "boolean") {
    platformConfig.jobPostingEnabled = updates.jobPostingEnabled;
  }
  platformConfig.updatedAt = new Date().toISOString();

  auditLogsStore.push({
    id: `audit-${Date.now()}`,
    action: "CONFIG_UPDATED",
    performedBy: adminId,
    targetId: platformConfig.id,
    details: JSON.stringify(updates),
    createdAt: new Date().toISOString()
  });

  return platformConfig;
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogList({ action, startDate, endDate, page, limit }) {
  let logs = [...auditLogsStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (action) logs = logs.filter((l) => l.action === action);
  if (startDate) logs = logs.filter((l) => new Date(l.createdAt) >= new Date(startDate));
  if (endDate) logs = logs.filter((l) => new Date(l.createdAt) <= new Date(endDate));

  const total = logs.length;
  const start = (page - 1) * limit;
  const data = logs.slice(start, start + limit);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
