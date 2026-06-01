import { env } from "../config/env.js";

// ---------------------------------------------------------------------------
// In-memory stores (stand-in for Prisma queries). When a real DB is connected,
// swap these out for Prisma client calls.
// ---------------------------------------------------------------------------

const memoryStore = {
  users: [
    { id: "user-1",  email: "alice@example.com",   fullName: "Alice Chen",       role: "FREELANCER", isSuspended: false, isBanned: false, isVerified: true,  trustScore: 85, skills: ["React","Node.js"],  createdAt: "2025-01-15T08:00:00Z", postedJobs: [], disputeCount: 0 },
    { id: "user-2",  email: "bob@example.com",     fullName: "Bob Martinez",     role: "CLIENT",     isSuspended: false, isBanned: false, isVerified: true,  trustScore: 72, skills: [], createdAt: "2025-02-10T10:30:00Z", postedJobs: ["job-1","job-2"], disputeCount: 1 },
    { id: "user-3",  email: "charlie@example.com", fullName: "Charlie Okafor",   role: "FREELANCER", isSuspended: true,  isBanned: false, isVerified: false, trustScore: 30, skills: ["Python","ML"],   createdAt: "2025-03-05T14:00:00Z", postedJobs: [], disputeCount: 2 },
    { id: "user-4",  email: "diana@example.com",   fullName: "Diana Torres",     role: "CLIENT",     isSuspended: false, isBanned: true,  isVerified: false, trustScore: 10, skills: [], createdAt: "2025-01-20T09:00:00Z", postedJobs: [], disputeCount: 3 },
  ],
  flaggedJobs: [
    { id: "flag-1", jobId: "job-3", jobTitle: "Crypto mining bot",    reason: "AUTOMATED",    description: "Detected prohibited crypto-mining keyword",            status: "PENDING",  createdAt: "2025-05-20T12:00:00Z" },
    { id: "flag-2", jobId: "job-4", jobTitle: "Write my thesis",      reason: "USER_REPORTED", description: "Reported by user-2 as academic dishonesty",            status: "PENDING",  createdAt: "2025-05-22T15:30:00Z" },
    { id: "flag-3", jobId: "job-5", jobTitle: "Adult content mod",    reason: "AUTOMATED",    description: "Suspected adult-content category mismatch",             status: "APPROVED", createdAt: "2025-05-18T10:00:00Z" },
  ],
  disputes: [
    { id: "disp-1", jobTitle: "E-commerce dashboard",         clientName: "Bob Martinez",      freelancerName: "Alice Chen",    reason: "Deliverable does not match spec",    evidence: "Screenshots attached", status: "OPEN",          rulingSide: "NONE",       createdAt: "2025-05-25T08:00:00Z" },
    { id: "disp-2", jobTitle: "API integration",              clientName: "Diana Torres",      freelancerName: "Charlie Okafor",  reason: "Missed deadline by 3 weeks",         evidence: "Contract + emails",    status: "UNDER_REVIEW",  rulingSide: "NONE",       createdAt: "2025-05-10T10:00:00Z" },
    { id: "disp-3", jobTitle: "Logo design",                  clientName: "Bob Martinez",      freelancerName: "Charlie Okafor",  reason: "Resolved via mutual agreement",      evidence: "",         status: "RESOLVED",     rulingSide: "FREELANCER", createdAt: "2025-04-01T09:00:00Z", rulingNote: "Partial payment released" },
  ],
  platformSettings: {
    registrationsEnabled: "true",
    maintenanceMode: "false",
    maxJobBudget: "50000",
    defaultTrustScore: "50",
  },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

let idCounter = 100;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function paginate(list, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  return { items: list.slice(start, start + limit), total: list.length, page, limit };
}

function filterUsers(users, { search, role, status, joinFrom, joinTo }) {
  let filtered = [...users];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status === "suspended") filtered = filtered.filter((u) => u.isSuspended);
  if (status === "banned") filtered = filtered.filter((u) => u.isBanned);
  if (status === "active") filtered = filtered.filter((u) => !u.isSuspended && !u.isBanned);
  if (joinFrom) filtered = filtered.filter((u) => new Date(u.createdAt) >= new Date(joinFrom));
  if (joinTo) filtered = filtered.filter((u) => new Date(u.createdAt) <= new Date(joinTo));
  return filtered;
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

export async function getAdminDashboardMetrics() {
  const users = memoryStore.users;
  const jobsCount = 42; // would come from Job.count()
  const openDisputes = memoryStore.disputes.filter((d) => d.status === "OPEN").length;
  const flaggedListings = memoryStore.flaggedJobs.filter((f) => f.status === "PENDING").length;
  const revenue = 128900; // would aggregate payments

  // Trust score distribution buckets
  const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  users.forEach((u) => {
    const s = u.trustScore;
    if (s <= 20) buckets["0-20"]++;
    else if (s <= 40) buckets["21-40"]++;
    else if (s <= 60) buckets["41-60"]++;
    else if (s <= 80) buckets["61-80"]++;
    else buckets["81-100"]++;
  });

  return {
    totalUsers: users.length,
    activeJobs: jobsCount,
    openDisputes,
    flaggedListings,
    revenue,
    trustDistribution: Object.entries(buckets).map(([range, count]) => ({ range, count })),
  };
}

// ── User Management ────────────────────────────────────────────────────────

export async function listAdminUsers({ page, limit, search, role, status, joinFrom, joinTo }) {
  const filtered = filterUsers(memoryStore.users, { search, role, status, joinFrom, joinTo });
  return paginate(filtered, page, limit);
}

export async function getUserProfile(userId) {
  const user = memoryStore.users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  const activeJobs = memoryStore.flaggedJobs.filter((f) => f.jobId && memoryStore.users.find(u => u.id === userId));
  const disputes = memoryStore.disputes.filter(
    (d) => d.clientName === user.fullName || d.freelancerName === user.fullName
  );
  return { ...user, activeJobs: activeJobs.length, disputeHistory: disputes };
}

export async function suspendUser(userId) {
  const user = memoryStore.users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.isSuspended = true;
  return { ...user, action: "suspended" };
}

export async function reinstateUser(userId) {
  const user = memoryStore.users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.isSuspended = false;
  return { ...user, action: "reinstated" };
}

export async function banUser(userId) {
  const user = memoryStore.users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  user.isBanned = true;
  user.isSuspended = true;
  return { ...user, action: "banned" };
}

// ── Job Moderation ─────────────────────────────────────────────────────────

export async function listFlaggedJobs({ status, page, limit }) {
  let filtered = [...memoryStore.flaggedJobs];
  if (status) filtered = filtered.filter((f) => f.status === status);
  return paginate(filtered, page, limit);
}

export async function approveFlaggedJob(flagId) {
  const flag = memoryStore.flaggedJobs.find((f) => f.id === flagId);
  if (!flag) throw Object.assign(new Error("Flagged job not found"), { statusCode: 404 });
  flag.status = "APPROVED";
  return { ...flag, action: "approved", notificationSent: true };
}

export async function rejectFlaggedJob(flagId, reason) {
  const flag = memoryStore.flaggedJobs.find((f) => f.id === flagId);
  if (!flag) throw Object.assign(new Error("Flagged job not found"), { statusCode: 404 });
  flag.status = "REJECTED";
  flag.rejectionReason = reason || "Violates platform policy";
  return { ...flag, action: "rejected", notificationSent: true };
}

export async function escalateFlaggedJob(flagId) {
  const flag = memoryStore.flaggedJobs.find((f) => f.id === flagId);
  if (!flag) throw Object.assign(new Error("Flagged job not found"), { statusCode: 404 });
  flag.status = "ESCALATED";
  return { ...flag, action: "escalated" };
}

// ── Dispute Resolution ─────────────────────────────────────────────────────

export async function listDisputes({ status, page, limit }) {
  let filtered = [...memoryStore.disputes];
  if (status) filtered = filtered.filter((d) => d.status === status);
  return paginate(filtered, page, limit);
}

export async function getDisputeDetail(disputeId) {
  const dispute = memoryStore.disputes.find((d) => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });
  return {
    ...dispute,
    fullThread: [
      { from: "system", message: "Dispute opened", timestamp: dispute.createdAt },
      { from: dispute.clientName, message: `Reason: ${dispute.reason}`, timestamp: dispute.createdAt },
    ],
  };
}

export async function ruleOnDispute(disputeId, rulingSide, rulingNote) {
  const dispute = memoryStore.disputes.find((d) => d.id === disputeId);
  if (!dispute) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });

  dispute.rulingSide = rulingSide;
  dispute.rulingNote = rulingNote || `Ruled in favour of ${rulingSide.toLowerCase()}`;
  dispute.status = "RESOLVED";

  return {
    ...dispute,
    action: "resolved",
    refundTriggered: rulingSide === "CLIENT",
    notificationsSent: true,
  };
}

// ── Platform Controls ──────────────────────────────────────────────────────

export async function getPlatformSettings() {
  return { ...memoryStore.platformSettings };
}

export async function updatePlatformSetting(key, value) {
  if (!(key in memoryStore.platformSettings)) {
    throw Object.assign(new Error(`Unknown setting: ${key}`), { statusCode: 400 });
  }
  memoryStore.platformSettings[key] = String(value);
  return { key, value: String(value), updated: true };
}
