export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900,
  };
}

export async function getAdminDashboard() {
  const metrics = await getAdminMetrics();

  const users = [
    { id: "u-001", name: "Alice Chen", email: "alice@example.com", role: "client", status: "active", joinedAt: "2025-11-01T00:00:00Z", jobCount: 5, disputeCount: 0 },
    { id: "u-002", name: "Bob Martinez", email: "bob@example.com", role: "freelancer", status: "active", joinedAt: "2025-10-15T00:00:00Z", jobCount: 12, disputeCount: 1 },
    { id: "u-003", name: "Carol Singh", email: "carol@example.com", role: "freelancer", status: "suspended", joinedAt: "2025-09-20T00:00:00Z", jobCount: 3, disputeCount: 2 },
    { id: "u-004", name: "Dave Park", email: "dave@example.com", role: "client", status: "banned", joinedAt: "2025-08-05T00:00:00Z", jobCount: 0, disputeCount: 3 },
    { id: "u-005", name: "Eve Wilson", email: "eve@example.com", role: "freelancer", status: "active", joinedAt: "2026-01-10T00:00:00Z", jobCount: 8, disputeCount: 0 },
  ];

  const disputes = [
    { id: "d-001", jobId: "job-103", clientId: "u-001", freelancerId: "u-002", status: "open", reason: "Deliverable did not match description", createdAt: "2026-05-10T00:00:00Z" },
    { id: "d-002", jobId: "job-101", clientId: "u-001", freelancerId: "u-003", status: "under_review", reason: "Freelancer missed deadline by 2 weeks", createdAt: "2026-05-05T00:00:00Z" },
    { id: "d-003", jobId: "job-105", clientId: "u-005", freelancerId: "u-002", status: "resolved", reason: "Payment dispute over scope change", createdAt: "2026-04-20T00:00:00Z" },
  ];

  const flaggedJobs = [
    { id: "fj-001", title: "Quick money opportunity", flaggedBy: "u-002", reason: "Possible scam listing", createdAt: "2026-05-18T00:00:00Z", status: "pending" },
    { id: "fj-002", title: "Logo design $5", flaggedBy: "u-005", reason: "Below minimum budget", createdAt: "2026-05-15T00:00:00Z", status: "escalated" },
  ];

  const controls = {
    registrationsEnabled: true,
    jobPostingsEnabled: true,
  };

  const auditLog = [
    { id: "a-001", adminId: "admin-1", action: "suspend_user", target: "u-003", timestamp: "2026-05-18T14:30:00Z", details: "Repeated missed deadlines" },
    { id: "a-002", adminId: "admin-1", action: "ban_user", target: "u-004", timestamp: "2026-05-17T09:15:00Z", details: "Fraudulent activity detected" },
    { id: "a-003", adminId: "admin-2", action: "approve_job", target: "fj-001", timestamp: "2026-05-16T11:00:00Z", details: "Reviewed and approved after investigation" },
    { id: "a-004", adminId: "admin-1", action: "toggle_registrations", target: "platform", timestamp: "2026-05-15T08:45:00Z", details: "Disabled registrations temporarily" },
    { id: "a-005", adminId: "admin-2", action: "resolve_dispute", target: "d-003", timestamp: "2026-05-14T16:20:00Z", details: "Ruled in favor of freelancer" },
  ];

  return { metrics, users, disputes, flaggedJobs, controls, auditLog };
}

export async function suspendUser(userId: string) {
  return { success: true, userId, status: "suspended" };
}

export async function reactivateUser(userId: string) {
  return { success: true, userId, status: "active" };
}

export async function banUser(userId: string) {
  return { success: true, userId, status: "banned" };
}

export async function approveJob(jobId: string) {
  return { success: true, jobId, status: "approved" };
}

export async function rejectJob(jobId: string, reason: string) {
  return { success: true, jobId, status: "rejected", reason };
}

export async function escalateJob(jobId: string) {
  return { success: true, jobId, status: "escalated" };
}

export async function reviewDispute(disputeId: string) {
  return { success: true, disputeId, status: "under_review" };
}

export async function resolveDispute(disputeId: string, ruling: "client" | "freelancer" | "split") {
  return { success: true, disputeId, status: "resolved", ruling };
}

export async function toggleRegistrations(enabled: boolean) {
  return { success: true, registrationsEnabled: enabled };
}

export async function toggleJobPostings(enabled: boolean) {
  return { success: true, jobPostingsEnabled: enabled };
}