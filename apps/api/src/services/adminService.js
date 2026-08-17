import { auditLog } from "../models/auditLog.js";

export const platform = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

export const users = [
  { id: "u1", email: "alice@example.com", fullName: "Alice", role: "CLIENT", status: "active", trustScore: 92, createdAt: "2024-01-05T10:00:00Z" },
  { id: "u2", email: "bob@example.com", fullName: "Bob", role: "FREELANCER", status: "active", trustScore: 85, createdAt: "2024-01-12T12:00:00Z" },
  { id: "u3", email: "carol@example.com", fullName: "Carol", role: "CLIENT", status: "suspended", trustScore: 41, createdAt: "2024-02-03T09:00:00Z" },
  { id: "u4", email: "dave@example.com", fullName: "Dave", role: "FREELANCER", status: "banned", trustScore: 10, createdAt: "2024-02-14T11:00:00Z" }
];

export const jobs = [
  { id: "j1", title: "Build AI chatbot", status: "OPEN", clientId: "u1", flagged: true, flagReason: "Suspicious payment terms", createdAt: "2024-03-01T08:00:00Z" },
  { id: "j2", title: "Design landing page", status: "OPEN", clientId: "u1", flagged: false, createdAt: "2024-03-02T09:00:00Z" },
  { id: "j3", title: "Migrate legacy API", status: "OPEN", clientId: "u3", flagged: true, flagReason: "Duplicate posting", createdAt: "2024-03-03T10:00:00Z" }
];

export const disputes = [
  { id: "d1", jobId: "j1", parties: ["u1", "u2"], status: "open", evidence: ["payment_screenshot.png"], transactionAmount: 1500, thread: [{ author: "u1", message: "Work not delivered." }, { author: "u2", message: "Client changed requirements." }] },
  { id: "d2", jobId: "j2", parties: ["u1", "u3"], status: "under_review", evidence: ["contract.pdf"], transactionAmount: 900, thread: [{ author: "u3", message: "Quality issues." }] },
  { id: "d3", jobId: "j3", parties: ["u3", "u2"], status: "resolved", evidence: [], transactionAmount: 2800, thread: [] }
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((j) => j.status === "OPEN").length,
    openDisputes: disputes.filter((d) => d.status !== "resolved").length,
    flaggedListings: jobs.filter((j) => j.flagged).length,
    revenue: 128900
  };
}

export async function listUsers({ page = 1, pageSize = 10, search, role, status, from, to } = {}) {
  let result = [...users];
  if (search) result = result.filter((u) => u.email.includes(search) || u.fullName.toLowerCase().includes(search.toLowerCase()));
  if (role) result = result.filter((u) => u.role === role);
  if (status) result = result.filter((u) => u.status === status);
  if (from) result = result.filter((u) => new Date(u.createdAt) >= new Date(from));
  if (to) result = result.filter((u) => new Date(u.createdAt) <= new Date(to));
  const total = result.length;
  const start = (page - 1) * pageSize;
  result = result.slice(start, start + pageSize);
  return { items: result, total, page, pageSize };
}

export async function getUserProfile(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const userJobs = jobs.filter((j) => j.clientId === userId);
  const userDisputes = disputes.filter((d) => d.parties.includes(userId));
  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function updateUserStatus(userId, action, reason, adminId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  user.status = action === "ban" ? "banned" : action === "suspend" ? "suspended" : "active";
  auditLog.append({ adminId, action: `user_${action}`, targetId: userId, reason });
  return user;
}

export async function listFlaggedJobs({ page = 1, pageSize = 10 } = {}) {
  const items = jobs.filter((j) => j.flagged);
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export async function moderateJob(jobId, decision, adminId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.flagged = false;
  job.decision = decision;
  if (decision === "rejected") {
    auditLog.append({ adminId, action: "job_rejected", targetId: jobId, reason: "Listing rejected by admin" });
  } else if (decision === "escalated") {
    auditLog.append({ adminId, action: "job_escalated", targetId: jobId, reason: "Escalated for review" });
  } else {
    auditLog.append({ adminId, action: "job_approved", targetId: jobId, reason: "Listing approved" });
  }
  return job;
}

export async function listDisputes({ page = 1, pageSize = 10, status } = {}) {
  let items = [...disputes];
  if (status) items = items.filter((d) => d.status === status);
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export async function getDispute(disputeId) {
  return disputes.find((d) => d.id === disputeId) || null;
}

export async function resolveDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) return null;
  dispute.status = "resolved";
  dispute.ruling = ruling;
  auditLog.append({ adminId, action: "dispute_ruled", targetId: disputeId, reason: ruling });
  return dispute;
}

export async function getTrustDistribution() {
  const bins = [
    { label: "0-20", count: 0 },
    { label: "21-40", count: 0 },
    { label: "41-60", count: 0 },
    { label: "61-80", count: 0 },
    { label: "81-100", count: 0 }
  ];
  for (const user of users) {
    const score = user.trustScore;
    if (score <= 20) bins[0].count += 1;
    else if (score <= 40) bins[1].count += 1;
    else if (score <= 60) bins[2].count += 1;
    else if (score <= 80) bins[3].count += 1;
    else bins[4].count += 1;
  }
  return bins;
}

export async function updatePlatformControl(control, enabled, adminId) {
  if (control === "registrations") {
    platform.registrationsEnabled = enabled;
    auditLog.append({ adminId, action: enabled ? "registrations_enabled" : "registrations_disabled", targetId: "platform", reason: "Control updated" });
  } else if (control === "job_postings") {
    platform.jobPostingsEnabled = enabled;
    auditLog.append({ adminId, action: enabled ? "job_postings_enabled" : "job_postings_disabled", targetId: "platform", reason: "Control updated" });
  } else {
    return null;
  }
  return platform;
}

export async function getPlatformControls(adminId) {
  return platform;
}

export async function listAuditLog(filters = {}) {
  return auditLog.list(filters);
}
