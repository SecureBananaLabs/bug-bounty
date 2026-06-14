const users = [
  { id: "usr_1", email: "alice@example.com", name: "Alice Johnson", role: "freelancer", status: "active", joinDate: "2026-01-15", jobsActive: 3, disputeCount: 0, trustScore: 92 },
  { id: "usr_2", email: "bob@example.com", name: "Bob Smith", role: "client", status: "active", joinDate: "2026-02-01", jobsActive: 5, disputeCount: 1, trustScore: 78 },
  { id: "usr_3", email: "carol@example.com", name: "Carol Davis", role: "freelancer", status: "suspended", joinDate: "2026-01-20", jobsActive: 0, disputeCount: 3, trustScore: 34 },
  { id: "usr_4", email: "dave@example.com", name: "Dave Wilson", role: "client", status: "active", joinDate: "2026-03-10", jobsActive: 2, disputeCount: 0, trustScore: 95 },
  { id: "usr_5", email: "eve@example.com", name: "Eve Martin", role: "freelancer", status: "active", joinDate: "2026-02-15", jobsActive: 7, disputeCount: 0, trustScore: 88 },
  { id: "usr_6", email: "frank@example.com", name: "Frank Lee", role: "client", status: "banned", joinDate: "2026-01-05", jobsActive: 0, disputeCount: 5, trustScore: 12 },
  { id: "usr_7", email: "grace@example.com", name: "Grace Kim", role: "freelancer", status: "active", joinDate: "2026-04-01", jobsActive: 1, disputeCount: 0, trustScore: 75 },
  { id: "usr_8", email: "admin@freelanceflow.com", name: "Admin User", role: "admin", status: "active", joinDate: "2026-01-01", jobsActive: 0, disputeCount: 0, trustScore: 100 },
];

const jobs = [
  { id: "job_1", title: "Build an AI customer support widget", clientId: "usr_2", budget: 1500, status: "open", flagged: false, flagReason: null, description: "Develop an AI-powered customer support widget using LLM APIs." },
  { id: "job_2", title: "Migrate legacy API to Node.js", clientId: "usr_4", budget: 2800, status: "open", flagged: true, flagReason: "Suspicious budget range", description: "Migrate a legacy Python API to Node.js with improved performance." },
  { id: "job_3", title: "Design SaaS onboarding flows", clientId: "usr_2", budget: 900, status: "in_progress", flagged: false, flagReason: null, description: "Design user onboarding flows for a B2B SaaS platform." },
  { id: "job_4", title: "Full-stack dashboard rebuild", clientId: "usr_4", budget: 4500, status: "open", flagged: true, flagReason: "Possible duplicate listing", description: "Rebuild the analytics dashboard from scratch using Next.js." },
  { id: "job_5", title: "Write API documentation", clientId: "usr_5", budget: 600, status: "completed", flagged: false, flagReason: null, description: "Document all REST API endpoints with OpenAPI spec." },
  { id: "job_6", title: "Kubernetes cluster setup", clientId: "usr_2", budget: 3200, status: "open", flagged: true, flagReason: "User reported: suspicious requirements", description: "Set up and configure a production Kubernetes cluster." },
  { id: "job_7", title: "Mobile app UI polish", clientId: "usr_5", budget: 1200, status: "in_progress", flagged: false, flagReason: null, description: "Polish the mobile app UI for consistency and accessibility." },
  { id: "job_8", title: "Data pipeline optimization", clientId: "usr_2", budget: 5000, status: "open", flagged: false, flagReason: null, description: "Optimize ETL data pipeline for 10x throughput improvement." },
];

const disputes = [
  { id: "disp_1", jobId: "job_3", freelancerId: "usr_1", clientId: "usr_2", status: "open", reason: "Client claims work was incomplete", evidence: ["chat_logs_3.pdf", "delivery_screenshot.png"], amount: 900, openedAt: "2026-05-10T08:00:00Z", messages: [
    { from: "client", text: "The work is not complete, only 3 out of 5 screens were done.", at: "2026-05-10T09:00:00Z" },
    { from: "freelancer", text: "All 5 screens were delivered on May 8. Please check again.", at: "2026-05-10T10:30:00Z" },
  ]},
  { id: "disp_2", jobId: "job_5", freelancerId: "usr_5", clientId: "usr_2", status: "under_review", reason: "Payment dispute after delivery", evidence: ["contract_signed.pdf", "payment_screenshot.png"], amount: 600, openedAt: "2026-05-08T14:00:00Z", messages: [
    { from: "freelancer", text: "Client is refusing to pay after accepting the delivery.", at: "2026-05-08T15:00:00Z" },
    { from: "client", text: "The documentation has missing sections.", at: "2026-05-08T16:30:00Z" },
    { from: "freelancer", text: "The contract specified 10 endpoints. I documented all 10.", at: "2026-05-08T17:00:00Z" },
  ]},
  { id: "disp_3", jobId: "job_1", freelancerId: "usr_1", clientId: "usr_4", status: "resolved", reason: "Freelancer claims additional scope", evidence: ["scope_document.pdf"], amount: 1500, openedAt: "2026-05-01T10:00:00Z", resolvedAt: "2026-05-05T12:00:00Z", resolution: "Ruled in favor of client. Scope was clearly defined.", messages: [
    { from: "freelancer", text: "The client asked for features beyond the original scope.", at: "2026-05-01T11:00:00Z" },
    { from: "client", text: "All features were in the original specification document.", at: "2026-05-01T14:00:00Z" },
  ]},
];

const auditLog = [];
let auditIdCounter = 1;

const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
};

let userIdCounter = 9;
let jobIdCounter = 9;
let disputeIdCounter = 4;

function pushAudit(adminId, action, details) {
  auditLog.push({
    id: `audit_${auditIdCounter++}`,
    adminId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

export async function getAdminMetrics() {
  const activeUsers = users.filter((u) => u.status === "active").length;
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;
  const flaggedJobs = jobs.filter((j) => j.flagged).length;
  const revenue = jobs.filter((j) => j.status === "completed").length * 1500 + 3200;
  return {
    totalUsers: users.length,
    activeUsers,
    openJobs,
    openDisputes,
    flaggedJobs,
    revenue,
    trustDistribution: [12, 34, 75, 88, 92, 95, 100].map((s) => ({ score: s, count: users.filter((u) => u.trustScore >= s - 15 && u.trustScore < s + 15).length })),
  };
}

export async function listUsers({ search, role, status, page, perPage }) {
  let filtered = [...users];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);
  const total = filtered.length;
  const p = page || 1;
  const pp = perPage || 20;
  const paged = filtered.slice((p - 1) * pp, p * pp);
  return { users: paged, total, page: p, perPage: pp };
}

export async function getUserDetail(id) {
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  return user;
}

export async function suspendUser(adminId, userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  user.status = "suspended";
  pushAudit(adminId, "user_suspend", { userId, email: user.email });
  return user;
}

export async function reinstateUser(adminId, userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  user.status = "active";
  pushAudit(adminId, "user_reinstate", { userId, email: user.email });
  return user;
}

export async function banUser(adminId, userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  user.status = "banned";
  pushAudit(adminId, "user_ban", { userId, email: user.email });
  return user;
}

export async function listModeration({ page, perPage, status }) {
  let filtered = jobs.filter((j) => j.flagged);
  if (status === "pending") filtered = filtered.filter((j) => j.status === "open");
  const total = filtered.length;
  const p = page || 1;
  const pp = perPage || 20;
  const paged = filtered.slice((p - 1) * pp, p * pp);
  return { items: paged, total, page: p, perPage: pp };
}

export async function approveJob(adminId, jobId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.flagged = false;
  job.flagReason = null;
  pushAudit(adminId, "job_approve", { jobId, title: job.title });
  return job;
}

export async function rejectJob(adminId, jobId, reason) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = "rejected";
  job.flagged = false;
  job.flagReason = reason;
  pushAudit(adminId, "job_reject", { jobId, title: job.title, reason });
  return job;
}

export async function listDisputes({ page, perPage, status }) {
  let filtered = [...disputes];
  if (status) filtered = filtered.filter((d) => d.status === status);
  const total = filtered.length;
  const p = page || 1;
  const pp = perPage || 20;
  const paged = filtered.slice((p - 1) * pp, p * pp);
  return { disputes: paged, total, page: p, perPage: pp };
}

export async function getDisputeDetail(id) {
  const dispute = disputes.find((d) => d.id === id);
  if (!dispute) throw new Error("Dispute not found");
  return dispute;
}

export async function ruleOnDispute(adminId, disputeId, ruling, party) {
  const dispute = disputes.find((d) => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.resolvedAt = new Date().toISOString();
  dispute.resolution = `Ruled in favor of ${party}. ${ruling}`;
  pushAudit(adminId, "dispute_rule", { disputeId, ruling, party });
  return dispute;
}

export async function getControls() {
  return { ...platformControls };
}

export async function updateControls(adminId, updates) {
  if (updates.registrationsEnabled !== undefined) {
    platformControls.registrationsEnabled = updates.registrationsEnabled;
    pushAudit(adminId, "toggle_registrations", { value: updates.registrationsEnabled });
  }
  if (updates.jobPostingsEnabled !== undefined) {
    platformControls.jobPostingsEnabled = updates.jobPostingsEnabled;
    pushAudit(adminId, "toggle_job_postings", { value: updates.jobPostingsEnabled });
  }
  return { ...platformControls };
}

export async function getAuditLog({ adminId, action, dateFrom, dateTo, page, perPage }) {
  let filtered = [...auditLog];
  if (adminId) filtered = filtered.filter((e) => e.adminId === adminId);
  if (action) filtered = filtered.filter((e) => e.action === action);
  if (dateFrom) filtered = filtered.filter((e) => e.timestamp >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.timestamp <= dateTo);
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const total = filtered.length;
  const p = page || 1;
  const pp = perPage || 50;
  const paged = filtered.slice((p - 1) * pp, p * pp);
  return { entries: paged, total, page: p, perPage: pp };
}
