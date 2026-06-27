// In-memory stores (mirrors the existing service pattern in this codebase)
const users = [];
const jobs = [];
const disputes = [];
const flags = [];

let registrationEnabled = true;
let newJobPostingEnabled = true;

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    openJobs: jobs.filter(j => j.status === "open").length,
    activeFreelancers: users.filter(u => u.role === "freelancer").length,
    openDisputes: disputes.filter(d => d.status === "open").length,
    flaggedListings: flags.filter(f => !f.resolved).length,
    monthlyVolume: 128900,
    registrationEnabled,
    newJobPostingEnabled
  };
}

export async function listUsers({ role, status, search } = {}) {
  let result = [...users];
  if (role) result = result.filter(u => u.role === role);
  if (status) result = result.filter(u => u.status === status);
  if (search) result = result.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );
  return result;
}

export async function updateUserStatus(userId, status) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error(`User ${userId} not found`);
  user.status = status;
  return user;
}

export async function listFlaggedJobs() {
  return flags.filter(f => !f.resolved);
}

export async function resolveFlaggedJob(flagId, action, reason) {
  const flag = flags.find(f => f.id === flagId);
  if (!flag) throw new Error(`Flag ${flagId} not found`);
  flag.resolved = true;
  flag.action = action;
  flag.reason = reason;
  return flag;
}

export async function listDisputes(status) {
  let result = [...disputes];
  if (status) result = result.filter(d => d.status === status);
  return result;
}

export async function resolveDispute(disputeId, ruling) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error(`Dispute ${disputeId} not found`);
  dispute.status = "resolved";
  dispute.ruling = ruling;
  return dispute;
}

export async function togglePlatformControl(control, enabled) {
  if (control === "registration") registrationEnabled = enabled;
  else if (control === "jobPosting") newJobPostingEnabled = enabled;
  else throw new Error(`Unknown control: ${control}`);
  return { control, enabled };
}
