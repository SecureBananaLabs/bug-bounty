const _users = [
  { id:"u1", email:"alice@example.com", fullName:"Alice Johnson", role:"CLIENT", status:"ACTIVE", isVerified:true, createdAt:"2024-01-15", activeJobs:3, disputes:0 },
  { id:"u2", email:"bob@example.com", fullName:"Bob Smith", role:"FREELANCER", status:"ACTIVE", isVerified:true, createdAt:"2024-02-01", activeJobs:2, disputes:1 },
  { id:"u3", email:"carol@example.com", fullName:"Carol White", role:"FREELANCER", status:"SUSPENDED", isVerified:false, createdAt:"2024-03-10", activeJobs:0, disputes:2 },
  { id:"u4", email:"dave@example.com", fullName:"Dave Brown", role:"CLIENT", status:"BANNED", isVerified:true, createdAt:"2024-01-20", activeJobs:0, disputes:3 },
  { id:"u5", email:"eve@example.com", fullName:"Eve Davis", role:"FREELANCER", status:"ACTIVE", isVerified:true, createdAt:"2024-04-05", activeJobs:5, disputes:0 },
];

const _flaggedJobs = [
  { id:"j1", title:"Build a web scraper for competitor sites", clientId:"u1", client:"Alice Johnson", reason:"Potential ToS violation", flaggedAt:"2024-06-01", status:"pending" },
  { id:"j2", title:"Write fake reviews for product", clientId:"u4", client:"Dave Brown", reason:"Fraudulent content", flaggedAt:"2024-06-02", status:"pending" },
  { id:"j3", title:"Urgent: crypto trading bot", clientId:"u1", client:"Alice Johnson", reason:"Automated report: suspicious keywords", flaggedAt:"2024-06-03", status:"escalated" },
];

const _disputes = [
  { id:"d1", title:"Payment not received after delivery", clientId:"u1", client:"Alice Johnson", freelancerId:"u2", freelancer:"Bob Smith", status:"open", amount:850, createdAt:"2024-06-01", evidence:"3 files" },
  { id:"d2", title:"Work quality does not match proposal", clientId:"u1", client:"Alice Johnson", freelancerId:"u3", freelancer:"Carol White", status:"under_review", amount:320, createdAt:"2024-05-28", evidence:"5 files" },
  { id:"d3", title:"Freelancer went unresponsive", clientId:"u4", client:"Dave Brown", freelancerId:"u5", freelancer:"Eve Davis", status:"resolved", amount:1200, createdAt:"2024-05-20", evidence:"2 files" },
];

const _auditLog = [
  { id:"a1", adminId:"admin_1", adminName:"Super Admin", action:"ban_user", targetType:"user", targetId:"u4", metadata:JSON.stringify({reason:"Repeated ToS violations"}), createdAt:"2024-06-03T14:22:00Z" },
  { id:"a2", adminId:"admin_1", adminName:"Super Admin", action:"disable_registrations", targetType:"platform", targetId:"settings", metadata:JSON.stringify({value:"true"}), createdAt:"2024-06-03T12:00:00Z" },
  { id:"a3", adminId:"admin_1", adminName:"Super Admin", action:"reject_job", targetType:"job", targetId:"j2", metadata:JSON.stringify({reason:"Fraudulent content"}), createdAt:"2024-06-02T18:45:00Z" },
  { id:"a4", adminId:"admin_1", adminName:"Super Admin", action:"suspend_user", targetType:"user", targetId:"u3", metadata:JSON.stringify({reason:"Multiple disputes"}), createdAt:"2024-06-01T09:30:00Z" },
];

const _settings = {
  registrations_enabled: "true",
  job_posting_enabled: "true",
};

export async function getAdminMetrics() {
  return {
    totalUsers: 1284,
    activeJobs: 342,
    openDisputes: 8,
    flaggedListings: 14,
    revenue: { current: 128900, currency: "USD", period: "MTD" },
    trustDistribution: { high: 68, medium: 24, low: 8 },
  };
}

export async function listUsers({ role, status, search, page = 1, limit = 20 }) {
  let users = [..._users];
  if (role) users = users.filter(u => u.role === role.toUpperCase());
  if (status) users = users.filter(u => u.status === status.toUpperCase());
  if (search) users = users.filter(u => u.email.includes(search) || u.fullName.toLowerCase().includes(search.toLowerCase()));
  const total = users.length;
  const data = users.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit };
}

export async function getUserDetail(id) {
  const user = _users.find(u => u.id === id);
  if (!user) throw new Error("User not found");
  return { ...user, proposals: [], disputes: _disputes.filter(d => d.clientId === id || d.freelancerId === id) };
}

export async function updateUserStatus(userId, status, adminId, reason) {
  const user = _users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  const prev = user.status;
  user.status = status.toUpperCase();
  _auditLog.unshift({ id: `a${Date.now()}`, adminId, adminName: "Admin", action: `${status.toLowerCase()}_user`, targetType: "user", targetId: userId, metadata: JSON.stringify({ from: prev, reason }), createdAt: new Date().toISOString() });
  return { success: true, userId, status: user.status };
}

export async function listFlaggedJobs({ page = 1, limit = 20 }) {
  const total = _flaggedJobs.length;
  const data = _flaggedJobs.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit };
}

export async function moderateJob(jobId, action, adminId, reason) {
  const job = _flaggedJobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");
  job.status = action;
  _auditLog.unshift({ id: `a${Date.now()}`, adminId, adminName: "Admin", action: `${action}_job`, targetType: "job", targetId: jobId, metadata: JSON.stringify({ reason }), createdAt: new Date().toISOString() });
  return { success: true, jobId, action };
}

export async function listDisputes({ status, page = 1, limit = 20 }) {
  let disputes = [..._disputes];
  if (status) disputes = disputes.filter(d => d.status === status);
  const total = disputes.length;
  const data = disputes.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit };
}

export async function getDispute(id) {
  const dispute = _disputes.find(d => d.id === id);
  if (!dispute) throw new Error("Dispute not found");
  return { ...dispute, thread: [{ from: "client", message: "I paid but received nothing." }, { from: "freelancer", message: "Work was delivered via email." }] };
}

export async function resolveDispute(disputeId, ruling, adminId, reason) {
  const dispute = _disputes.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");
  dispute.status = "resolved";
  dispute.resolution = ruling;
  _auditLog.unshift({ id: `a${Date.now()}`, adminId, adminName: "Admin", action: "resolve_dispute", targetType: "dispute", targetId: disputeId, metadata: JSON.stringify({ ruling, reason }), createdAt: new Date().toISOString() });
  return { success: true, disputeId, ruling };
}

export async function getPlatformSettings() {
  return Object.entries(_settings).map(([key, value]) => ({ key, value }));
}

export async function updatePlatformSetting(key, value, adminId) {
  _settings[key] = value;
  _auditLog.unshift({ id: `a${Date.now()}`, adminId, adminName: "Admin", action: `toggle_${key}`, targetType: "platform", targetId: "settings", metadata: JSON.stringify({ key, value }), createdAt: new Date().toISOString() });
  return { success: true, key, value };
}

export async function getAuditLog({ adminId, action, from, to, page = 1, limit = 50 }) {
  let logs = [..._auditLog];
  if (adminId) logs = logs.filter(l => l.adminId === adminId);
  if (action) logs = logs.filter(l => l.action.includes(action));
  if (from) logs = logs.filter(l => new Date(l.createdAt) >= new Date(from));
  if (to) logs = logs.filter(l => new Date(l.createdAt) <= new Date(to));
  const total = logs.length;
  const data = logs.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit };
}
