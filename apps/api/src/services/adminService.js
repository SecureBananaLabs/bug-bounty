const auditLogs = [];
const flaggedJobs = [
  { id: 'job_1', title: 'Suspicious Job', reason: 'Spam/Scam', status: 'pending' },
  { id: 'job_2', title: 'Fake Review Offer', reason: 'TOS Violation', status: 'pending' }
];
const disputes = [
  { id: 'disp_1', jobId: 'job_123', client: 'usr_c1', freelancer: 'usr_f1', status: 'open', amount: 500 },
  { id: 'disp_2', jobId: 'job_456', client: 'usr_c2', freelancer: 'usr_f2', status: 'under_review', amount: 1200 }
];

let platformSettings = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

export async function createAuditLog(adminId, action, details) {
  const log = {
    id: `log_${Date.now()}`,
    adminId,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  auditLogs.push(log);
  return log;
}

export async function getAuditLogs() {
  return auditLogs.slice().reverse(); // Return newest first
}

export async function getFlaggedJobs() {
  return flaggedJobs;
}

export async function moderateJob(jobId, action, reason, adminId) {
  const job = flaggedJobs.find(j => j.id === jobId);
  if (!job) throw new Error('Flagged job not found');
  
  job.status = action; // 'approved' or 'rejected'
  
  await createAuditLog(adminId, `moderate_job_${action}`, { jobId, reason });
  return job;
}

export async function getDisputes() {
  return disputes;
}

export async function ruleDispute(disputeId, ruling, notes, adminId) {
  const dispute = disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error('Dispute not found');
  
  dispute.status = 'resolved';
  dispute.ruling = ruling; // e.g., 'freelancer_favored', 'client_favored', 'refund'
  dispute.notes = notes;
  
  await createAuditLog(adminId, `rule_dispute`, { disputeId, ruling, notes });
  return dispute;
}

export async function getSettings() {
  return platformSettings;
}

export async function updateSettings(settings, adminId) {
  platformSettings = { ...platformSettings, ...settings };
  await createAuditLog(adminId, 'update_settings', settings);
  return platformSettings;
}

export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900,
    openDisputes: disputes.filter(d => d.status !== 'resolved').length,
    flaggedListings: flaggedJobs.filter(j => j.status === 'pending').length,
    totalUsers: 185 + 40 // mock total users
  };
}
