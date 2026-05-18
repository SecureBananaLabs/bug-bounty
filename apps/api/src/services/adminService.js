// In-memory datasets — consistent with the repo's mock/in-memory architecture

const users = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "freelancer", status: "active", joinDate: "2025-11-03", activeJobs: 2, disputes: 0 },
  { id: "u2", name: "Bob Marsh", email: "bob@example.com", role: "client", status: "active", joinDate: "2025-10-14", activeJobs: 3, disputes: 1 },
  { id: "u3", name: "Carol Diaz", email: "carol@example.com", role: "freelancer", status: "suspended", joinDate: "2025-09-22", activeJobs: 0, disputes: 2 },
  { id: "u4", name: "Dave Liu", email: "dave@example.com", role: "client", status: "active", joinDate: "2026-01-07", activeJobs: 1, disputes: 0 },
  { id: "u5", name: "Eva Johansson", email: "eva@example.com", role: "freelancer", status: "active", joinDate: "2026-02-18", activeJobs: 4, disputes: 0 },
  { id: "u6", name: "Frank Osei", email: "frank@example.com", role: "freelancer", status: "banned", joinDate: "2025-08-30", activeJobs: 0, disputes: 3 },
];

const flaggedJobs = [
  { id: "j1", title: "Build AI trading bot", postedBy: "bob@example.com", flagReason: "Potential TOS violation: automated financial transactions", status: "pending", flaggedAt: "2026-05-15T10:22:00Z" },
  { id: "j2", title: "Write marketing copy — adult product", postedBy: "dave@example.com", flagReason: "Content policy: adult content review required", status: "pending", flaggedAt: "2026-05-16T08:45:00Z" },
  { id: "j3", title: "Scrape competitor pricing data", postedBy: "bob@example.com", flagReason: "Potential TOS violation: data scraping", status: "under_review", flaggedAt: "2026-05-14T14:00:00Z" },
];

const disputes = [
  { id: "d1", title: "Payment withheld after delivery", freelancer: "alice@example.com", client: "bob@example.com", amount: 1200, status: "open", openedAt: "2026-05-10T09:00:00Z", evidence: "Delivery confirmed via commit logs. Client claims work incomplete." },
  { id: "d2", title: "Scope creep — extra revisions demanded", freelancer: "eva@example.com", client: "dave@example.com", amount: 450, status: "under_review", openedAt: "2026-05-12T15:30:00Z", evidence: "Original brief attached. 3 additional revision rounds requested post-acceptance." },
  { id: "d3", title: "No-show after advance payment", freelancer: "frank@example.com", client: "bob@example.com", amount: 800, status: "resolved", openedAt: "2026-04-28T11:00:00Z", ruling: "client_favor", evidence: "Freelancer unresponsive for 14 days. Full refund issued." },
];

const auditLog = [
  { action: "user_suspended", target: "carol@example.com", by: "admin", at: "2026-05-14T16:00:00Z" },
  { action: "job_rejected", target: "j3", by: "admin", at: "2026-05-15T09:30:00Z" },
  { action: "dispute_ruled", target: "d3", by: "admin", at: "2026-05-16T12:00:00Z", detail: "Ruled client_favor, refund triggered" },
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((s, u) => s + u.activeJobs, 0),
    openDisputes: disputes.filter(d => d.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter(j => j.status !== "rejected" && j.status !== "approved").length,
    revenue: { period: "May 2026", amount: 34750, currency: "usd" },
  };
}

export async function listUsers({ role, status, search } = {}) {
  let result = [...users];
  if (role) result = result.filter(u => u.role === role);
  if (status) result = result.filter(u => u.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  return result;
}

export async function updateUserStatus(userId, newStatus) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const allowed = ["active", "suspended", "banned"];
  if (!allowed.includes(newStatus)) throw new Error(`Invalid status: ${newStatus}`);
  user.status = newStatus;
  auditLog.push({ action: `user_${newStatus}`, target: user.email, by: "admin", at: new Date().toISOString() });
  return user;
}

export async function listFlaggedJobs(status) {
  if (status) return flaggedJobs.filter(j => j.status === status);
  return [...flaggedJobs];
}

export async function moderateJob(jobId, decision) {
  const job = flaggedJobs.find(j => j.id === jobId);
  if (!job) return null;
  const allowed = ["approved", "rejected", "escalated"];
  if (!allowed.includes(decision)) throw new Error(`Invalid decision: ${decision}`);
  job.status = decision === "escalated" ? "under_review" : decision;
  auditLog.push({ action: `job_${decision}`, target: jobId, by: "admin", at: new Date().toISOString() });
  return job;
}

export async function listDisputes(status) {
  if (status) return disputes.filter(d => d.status === status);
  return [...disputes];
}

export async function ruleDispute(disputeId, ruling) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) return null;
  const allowed = ["client_favor", "freelancer_favor", "escalated"];
  if (!allowed.includes(ruling)) throw new Error(`Invalid ruling: ${ruling}`);
  dispute.status = ruling === "escalated" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  auditLog.push({ action: "dispute_ruled", target: disputeId, by: "admin", at: new Date().toISOString(), detail: ruling });
  return dispute;
}

export async function getAuditLog() {
  return [...auditLog].reverse();
}
