import { createNotification } from "./notificationService.js";

export const state = {
  users: Array.from({length: 30}, (_, i) => ({
    id: `usr_${i}`, name: `User ${i}`, role: i % 5 === 0 ? 'admin' : (i % 2 === 0 ? 'freelancer' : 'client'),
    status: i % 7 === 0 ? 'suspended' : 'active', joinDate: new Date(Date.now() - i * 100000000).toISOString().split('T')[0],
    trustScore: 80 + (i % 20)
  })),
  jobs: Array.from({length: 15}, (_, i) => ({
    id: `job_${i}`, title: `Job ${i}`, status: i % 3 === 0 ? 'flagged' : 'active',
    reported: i % 3 === 0, posterId: `usr_${i}`, reason: i % 3 === 0 ? 'Suspicious content' : ''
  })),
  disputes: Array.from({length: 10}, (_, i) => ({
    id: `disp_${i}`, jobId: `job_${i}`, freelancerId: `usr_2`, clientId: `usr_3`,
    status: i % 2 === 0 ? 'open' : (i % 3 === 0 ? 'under_review' : 'resolved'),
    evidence: 'Screenshot.png', thread: [{ author: 'usr_2', msg: 'Job not done' }],
    transactionDetails: { amount: 500, currency: 'USD' }
  })),
  controls: {
    newRegistrations: true,
    newJobPostings: true
  },
  auditLog: []
};

function logAudit(adminId, action, details) {
  state.auditLog.push({ id: `log_${Date.now()}_${Math.random()}`, adminId, action, details, timestamp: new Date().toISOString() });
}

export async function getAdminMetrics() {
  return {
    openJobs: state.jobs.filter(j => j.status === 'active').length,
    activeFreelancers: state.users.filter(u => u.role === 'freelancer' && u.status === 'active').length,
    flaggedAccounts: state.users.filter(u => u.status === 'suspended' || u.status === 'banned').length,
    monthlyVolume: 128900,
    totalUsers: state.users.length,
    openDisputes: state.disputes.filter(d => d.status !== 'resolved').length,
    flaggedListings: state.jobs.filter(j => j.status === 'flagged').length,
    trustScoreDist: {
      "90-100": state.users.filter(u => u.trustScore >= 90).length,
      "70-89": state.users.filter(u => u.trustScore >= 70 && u.trustScore < 90).length,
      "0-69": state.users.filter(u => u.trustScore < 70).length
    }
  };
}

function paginate(array, page, limit) {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 10;
  return {
    data: array.slice((p - 1) * l, p * l),
    total: array.length,
    page: p,
    limit: l
  };
}

export async function getUsers(query) {
  let filtered = state.users;
  if (query.search) {
    filtered = filtered.filter(u => u.name.toLowerCase().includes(query.search.toLowerCase()) || u.id.includes(query.search));
  }
  if (query.role) filtered = filtered.filter(u => u.role === query.role);
  if (query.status) filtered = filtered.filter(u => u.status === query.status);
  if (query.dateFrom) filtered = filtered.filter(u => u.joinDate >= query.dateFrom);
  if (query.dateTo) filtered = filtered.filter(u => u.joinDate <= query.dateTo);
  return paginate(filtered, query.page, query.limit);
}

export async function updateUserStatus(adminId, id, action) {
  const user = state.users.find(u => u.id === id);
  if (!user) throw new Error("User not found");
  if (action === "suspend") user.status = "suspended";
  else if (action === "ban") user.status = "banned";
  else if (action === "reinstate") user.status = "active";
  else throw new Error("Invalid action");
  logAudit(adminId, `USER_${action.toUpperCase()}`, `Updated user ${id}`);
  return user;
}

export async function getFlaggedJobs(query) {
  return paginate(state.jobs.filter(j => j.status === 'flagged'), query.page, query.limit);
}

export async function moderateJob(adminId, id, action, payload = {}) {
  const job = state.jobs.find(j => j.id === id);
  if (!job) throw new Error("Job not found");
  if (action === "approve") job.status = "active";
  else if (action === "reject") {
    job.status = "rejected";
    await createNotification({ userId: job.posterId, message: `Your listing was rejected: ${payload.reason || 'Violated terms.'}` });
  }
  else if (action === "escalate") job.status = "escalated";
  else throw new Error("Invalid action");
  logAudit(adminId, `JOB_${action.toUpperCase()}`, `Moderated job ${id}`);
  return job;
}

export async function getDisputes(query) {
  return paginate(state.disputes, query.page, query.limit);
}

export async function moderateDispute(adminId, id, action) {
  const dispute = state.disputes.find(d => d.id === id);
  if (!dispute) throw new Error("Dispute not found");
  
  if (action === "rule" || action === "refund") {
    dispute.status = "resolved";
    await createNotification({ userId: dispute.freelancerId, message: `Dispute ${id} resolved (${action})` });
    await createNotification({ userId: dispute.clientId, message: `Dispute ${id} resolved (${action})` });
  } else if (action === "escalate") {
    dispute.status = "escalated";
  } else {
    throw new Error("Invalid action");
  }
  logAudit(adminId, `DISPUTE_${action.toUpperCase()}`, `Moderated dispute ${id}`);
  return dispute;
}

export async function getControls() {
  return state.controls;
}

export async function updateControls(adminId, controls) {
  state.controls = { ...state.controls, ...controls };
  logAudit(adminId, "UPDATE_CONTROLS", JSON.stringify(controls));
  return state.controls;
}

export async function getAuditLog(query) {
  let filtered = state.auditLog.slice().reverse();
  if (query.adminId) filtered = filtered.filter(l => l.adminId === query.adminId);
  if (query.actionType) filtered = filtered.filter(l => l.action === query.actionType);
  if (query.dateFrom) filtered = filtered.filter(l => l.timestamp >= query.dateFrom);
  if (query.dateTo) filtered = filtered.filter(l => l.timestamp <= query.dateTo);
  return paginate(filtered, query.page, query.limit);
}
