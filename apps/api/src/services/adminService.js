function generateMockUsers() {
  const roles = ["CLIENT", "FREELANCER", "ADMIN"];
  const statuses = ["active", "active", "active", "suspended", "banned"];
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Rosa", "Sam", "Tina"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

  const users = [];
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const role = roles[i % 3 === 0 && i > 0 ? (i % 2 === 0 ? 1 : 2) : (i % 2)];
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString();
    users.push({
      id: `user_${i + 1}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      fullName: `${firstName} ${lastName}`,
      role,
      isVerified: Math.random() > 0.2,
      status: i === 0 ? "active" : statuses[Math.floor(Math.random() * statuses.length)],
      createdAt,
      jobsCount: Math.floor(Math.random() * 20),
      disputesCount: Math.floor(Math.random() * 3),
    });
  }
  return users;
}

function generateMockFlaggedJobs() {
  const titles = ["Build E-commerce Site", "Fix Security Vulnerability", "Write Unit Tests", "Design Landing Page", "Database Migration", "API Integration", "Mobile App UI", "Data Analysis Pipeline", "DevOps Setup", "Content Management System"];
  const clients = ["Acme Corp", "TechStart Inc", "GlobalSoft", "DataFlow Systems", "Webify Studios", "CloudNine Ltd", "PixelPerfect Design", "CodeCraft Solutions", "InnovateLab", "SmartBase IO"];
  const reasons = ["Inappropriate content", "Suspicious activity", "Terms violation", "Fraudulent listing", "Duplicate posting", "Prohibited category"];

  const jobs = [];
  for (let i = 0; i < 25; i++) {
    jobs.push({
      id: `job_flagged_${i + 1}`,
      title: titles[i % titles.length],
      clientName: clients[i % clients.length],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      flaggedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      status: Math.random() > 0.6 ? "pending" : (Math.random() > 0.5 ? "approved" : "rejected"),
    });
  }
  return jobs;
}

function generateMockDisputes() {
  const jobTitles = ["Logo Design Project", "Backend API Development", "Content Writing Task", "Mobile App Bug Fix", "SEO Optimization", "WordPress Theme Customization", "Data Entry Project", "Social Media Campaign"];
  const clientNames = ["Alpha Corp", "Beta Inc", "Gamma Ltd", "Delta Systems", "Epsilon Tech", "Zeta Studio", "Eta Group", "Theta Solutions"];
  const freelancerNames = ["John Doe", "Jane Smith", "Mike Johnson", "Sara Lee", "Tom Brown", "Emma Wilson", "Chris Davis", "Amy Taylor"];
  const statuses = ["OPEN", "OPEN", "UNDER_REVIEW", "RESOLVED"];
  const reasons = ["Payment dispute", "Quality not as expected", "Missed deadline", "Scope creep", "Communication issues", "Deliverable not received"];

  const disputes = [];
  for (let i = 0; i < 20; i++) {
    disputes.push({
      id: `dispute_${i + 1}`,
      jobTitle: jobTitles[i % jobTitles.length],
      clientName: clientNames[i % clientNames.length],
      freelancerName: freelancerNames[i % freelancerNames.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      evidence: Math.random() > 0.3 ? "https://example.com/evidence/file_" + (i + 1) + ".pdf" : null,
      adminNotes: null,
      ruling: null,
      ruledInFavor: null,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString(),
    });
  }
  return disputes;
}

function generateMockAuditLogs() {
  const actions = ["LOGIN", "USER_SUSPENDED", "USER_REINSTATED", "USER_BANNED", "JOB_APPROVED", "JOB_REJECTED", "JOB_ESCALATED", "DISPUTE_RULED", "CONTROL_UPDATED", "CONFIG_CHANGED"];
  const targetTypes = ["user", "job", "dispute", "platform_config"];
  const adminIds = ["admin_1", "admin_2", "admin_3"];

  const logs = [];
  for (let i = 0; i < 100; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    logs.push({
      id: `log_${i + 1}`,
      adminId: adminIds[Math.floor(Math.random() * adminIds.length)],
      action,
      targetType,
      targetId: `${targetType}_${Math.floor(Math.random() * 100)}`,
      details: `${action} performed on ${targetType}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    });
  }
  return logs;
}

const allMockUsers = generateMockUsers();
const allMockFlaggedJobs = generateMockFlaggedJobs();
const allMockDisputes = generateMockDisputes();
const allMockAuditLogs = generateMockAuditLogs();

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return { items: paged, total, page, pageSize, totalPages };
}

export async function getAdminMetrics() {
  return {
    totalUsers: 1250,
    activeJobs: 342,
    openDisputes: 7,
    flaggedListings: 12,
    revenue: 284500,
    trustScoreDistribution: {
      excellent: 320,
      good: 580,
      fair: 210,
      poor: 90,
      veryPoor: 50,
    },
  };
}

export async function getUsers({ page = 1, pageSize = 10, search = "", role = "", status = "" }) {
  let filtered = [...allMockUsers];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }
  if (role) {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (status) {
    filtered = filtered.filter((u) => u.status === status);
  }

  const { items: users, total, page: p, pageSize: ps, totalPages } = paginate(filtered, page, pageSize);
  return { users, total, page: p, pageSize: ps, totalPages };
}

export async function getUserDetail(userId) {
  const user = allMockUsers.find((u) => u.id === userId);
  if (!user) return null;
  return {
    ...user,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    trustScore: Math.floor(Math.random() * 100) + 1,
    skills: ["JavaScript", "Python", "React"],
    recentActivity: [
      { type: "job_completed", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { type: "payment_received", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  };
}

export async function suspendUser(userId) {
  return { success: true };
}

export async function reinstateUser(userId) {
  return { success: true };
}

export async function banUser(userId) {
  return { success: true };
}

export async function getFlaggedJobs({ page = 1, pageSize = 10 }) {
  const { items: jobs, total, page: p, pageSize: ps, totalPages } = paginate(allMockFlaggedJobs, page, pageSize);
  return { jobs, total, page: p, pageSize: ps, totalPages };
}

export async function approveJob(jobId) {
  return { success: true };
}

export async function rejectJob(jobId, reason) {
  return { success: true };
}

export async function escalateJob(jobId) {
  return { success: true };
}

export async function getDisputes({ page = 1, pageSize = 10, status = "" }) {
  let filtered = [...allMockDisputes];
  if (status) {
    filtered = filtered.filter((d) => d.status === status);
  }
  const { items: disputes, total, page: p, pageSize: ps, totalPages } = paginate(filtered, page, pageSize);
  return { disputes, total, page: p, pageSize: ps, totalPages };
}

export async function getDisputeDetail(disputeId) {
  const dispute = allMockDisputes.find((d) => d.id === disputeId);
  if (!dispute) return null;
  return {
    ...dispute,
    jobBudget: "$500 - $1,000",
    jobCategory: "Web Development",
    evidence: dispute.evidence || null,
    adminNotes: dispute.adminNotes,
    ruling: dispute.ruling,
    ruledInFavor: dispute.ruledInFavor,
  };
}

export async function ruleDispute(disputeId, { ruling, ruledInFavor, adminNotes }) {
  return { success: true };
}

export async function getPlatformControls() {
  return {
    registrationOpen: true,
    jobPostingOpen: true,
    lastUpdated: new Date().toISOString(),
  };
}

export async function updatePlatformControl(key, value, adminId) {
  return { success: true };
}

export async function getAuditLog({ page = 1, pageSize = 20, adminId = "", action = "", startDate = "", endDate = "" }) {
  let filtered = [...allMockAuditLogs];

  if (adminId) {
    filtered = filtered.filter((l) => l.adminId === adminId);
  }
  if (action) {
    filtered = filtered.filter((l) => l.action === action);
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter((l) => new Date(l.createdAt).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter((l) => new Date(l.createdAt).getTime() <= end);
  }

  const { items: logs, total, page: p, pageSize: ps, totalPages } = paginate(filtered, page, pageSize);
  return { logs, total, page: p, pageSize: ps, totalPages };
}
