const MOCK_AUDIT_LOG = [];

function appendAudit(adminId, actionType, details) {
  MOCK_AUDIT_LOG.push({
    id: Date.now().toString(),
    adminId,
    actionType,
    details,
    timestamp: new Date().toISOString()
  });
}

export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900
  };
}

export async function getUsers({ page, limit }) {
  // Return stub pagination
  return {
    items: [],
    total: 0,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}

export async function updateUserStatus(adminId, userId, status) {
  appendAudit(adminId, 'UPDATE_USER_STATUS', { userId, status });
  return { success: true, userId, status };
}

export async function getModerationQueue({ page, limit }) {
  return {
    items: [],
    total: 0,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}

export async function moderateJob(adminId, jobId, status, reason) {
  appendAudit(adminId, 'MODERATE_JOB', { jobId, status, reason });
  return { success: true, jobId, status };
}

export async function getDisputes({ page, limit }) {
  return {
    items: [],
    total: 0,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}

export async function resolveDispute(adminId, disputeId, payload) {
  appendAudit(adminId, 'RESOLVE_DISPUTE', { disputeId, ...payload });
  return { success: true, disputeId, status: 'resolved' };
}

export async function toggleControl(adminId, setting, enabled) {
  appendAudit(adminId, 'TOGGLE_CONTROL', { setting, enabled });
  return { success: true, setting, enabled };
}

export async function getAuditLog({ page, limit, adminId, actionType }) {
  let logs = MOCK_AUDIT_LOG;
  if (adminId) logs = logs.filter(l => l.adminId === adminId);
  if (actionType) logs = logs.filter(l => l.actionType === actionType);
  
  const start = (page - 1) * limit;
  return {
    items: logs.slice(start, start + limit),
    total: logs.length,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}
