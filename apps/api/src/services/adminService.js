// In-memory persistent admin domain models and store
const usersStore = [
  { id: "usr_1", name: "Alex Rivers", email: "alex@example.com", role: "client", status: "active", joinDate: "2026-01-15", activeJobs: 3, disputes: 0 },
  { id: "usr_2", name: "Samantha Vance", email: "sam@example.com", role: "freelancer", status: "active", joinDate: "2026-02-01", activeJobs: 2, disputes: 1 },
  { id: "usr_3", name: "Marcus Stone", email: "marcus@example.com", role: "freelancer", status: "suspended", joinDate: "2026-02-18", activeJobs: 0, disputes: 2 },
  { id: "usr_4", name: "Elena Rostova", email: "elena@example.com", role: "client", status: "active", joinDate: "2026-03-05", activeJobs: 5, disputes: 0 },
  { id: "usr_5", name: "Devon Miles", email: "devon@example.com", role: "freelancer", status: "banned", joinDate: "2025-11-20", activeJobs: 0, disputes: 3 },
  { id: "usr_6", name: "Claire Chen", email: "claire@example.com", role: "freelancer", status: "active", joinDate: "2026-04-12", activeJobs: 1, disputes: 0 }
];

const flaggedJobsStore = [
  { id: "job_flag_1", title: "Cryptocurrency high-frequency trader bot", employer: "usr_1", employerName: "Alex Rivers", flagReason: "Suspicious API access patterns reported by user", status: "pending", createdAt: "2026-10-10" },
  { id: "job_flag_2", title: "Bypass KYC identity verification scripts", employer: "usr_4", employerName: "Elena Rostova", flagReason: "Automated rule: keyword prohibited", status: "pending", createdAt: "2026-10-11" },
  { id: "job_flag_3", title: "Scrape public e-commerce prices", employer: "usr_1", employerName: "Alex Rivers", flagReason: "High volume crawl request", status: "approved", createdAt: "2026-10-08" }
];

const disputesStore = [
  {
    id: "disp_101",
    contractTitle: "Next.js E-Commerce Redesign",
    clientId: "usr_1",
    clientName: "Alex Rivers",
    freelancerId: "usr_2",
    freelancerName: "Samantha Vance",
    amount: 1200,
    status: "open",
    thread: [
      { sender: "client", message: "Deliverable did not pass automated Lighthouse audit targets.", timestamp: "2026-10-09" },
      { sender: "freelancer", message: "Third-party tracking scripts added by client caused the score drop.", timestamp: "2026-10-10" }
    ],
    evidence: ["lighthouse-report.pdf", "audit-benchmark.json"],
    ruling: null
  },
  {
    id: "disp_102",
    contractTitle: "Rust Microservice Optimization",
    clientId: "usr_4",
    clientName: "Elena Rostova",
    freelancerId: "usr_3",
    freelancerName: "Marcus Stone",
    amount: 3500,
    status: "under_review",
    thread: [
      { sender: "client", message: "Work was not submitted before agreed milestone deadline.", timestamp: "2026-10-05" }
    ],
    evidence: ["git-log-diff.txt"],
    ruling: null
  }
];

const platformControlsStore = {
  allowRegistrations: true,
  allowJobPostings: true,
  lastModifiedBy: "admin_init",
  lastModifiedAt: new Date().toISOString()
};

const auditLogsStore = [
  { id: "aud_0", timestamp: new Date(Date.now() - 3600000).toISOString(), adminId: "admin_sys", actionType: "SYSTEM_INITIALIZE", details: "Admin control system initialized" }
];

export function logAdminAction(adminId, actionType, details) {
  const entry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminId: adminId || "admin_sys",
    actionType,
    details
  };
  auditLogsStore.unshift(entry);
  return entry;
}

export async function getAdminMetrics() {
  const totalUsers = usersStore.length;
  const activeJobs = flaggedJobsStore.length + 42;
  const openDisputes = disputesStore.filter(d => d.status === "open" || d.status === "under_review").length;
  const flaggedListings = flaggedJobsStore.filter(j => j.status === "pending").length;
  const monthlyRevenue = 142500;

  // Trust score distribution
  const trustScores = {
    excellent: 68,
    good: 22,
    fair: 7,
    flagged: 3
  };

  return {
    totalUsers,
    activeJobs,
    openDisputes,
    flaggedListings,
    monthlyRevenue,
    trustScores,
    lastRefreshed: new Date().toISOString()
  };
}

export async function getAdminUsers({ search = "", role = "", status = "", page = 1, limit = 10 } = {}) {
  let filtered = [...usersStore];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }
  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }
  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }

  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    data: paginated,
    total: filtered.length,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(filtered.length / limit) || 1
  };
}

export async function updateUserStatus(userId, status, adminId, reason = "") {
  const user = usersStore.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  const oldStatus = user.status;
  user.status = status;

  logAdminAction(adminId, "USER_STATUS_UPDATE", {
    userId,
    userName: user.name,
    from: oldStatus,
    to: status,
    reason
  });

  return user;
}

export async function getFlaggedJobs({ status = "", page = 1, limit = 10 } = {}) {
  let filtered = [...flaggedJobsStore];
  if (status) {
    filtered = filtered.filter(j => j.status === status);
  }
  const offset = (page - 1) * limit;
  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page: Number(page),
    limit: Number(limit)
  };
}

export async function moderateJob(jobId, action, adminId, reason = "") {
  const job = flaggedJobsStore.find(j => j.id === jobId);
  if (!job) throw new Error("Flagged job not found");
  job.status = action; // approved | rejected | escalated

  logAdminAction(adminId, "JOB_MODERATION", {
    jobId,
    action,
    reason,
    employer: job.employer
  });

  return {
    job,
    notificationSent: {
      recipient: job.employer,
      message: `Your job posting "${job.title}" was ${action}. Reason: ${reason || "Policy compliance check."}`
    }
  };
}

export async function getDisputes({ status = "", page = 1, limit = 10 } = {}) {
  let filtered = [...disputesStore];
  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }
  const offset = (page - 1) * limit;
  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page: Number(page),
    limit: Number(limit)
  };
}

export async function resolveDispute(disputeId, ruling, adminId, notes = "") {
  const dispute = disputesStore.find(d => d.id === disputeId);
  if (!dispute) throw new Error("Dispute not found");

  dispute.status = "resolved";
  dispute.ruling = {
    decision: ruling, // favor_client | favor_freelancer | refund | escalate
    decidedBy: adminId,
    decidedAt: new Date().toISOString(),
    notes
  };

  logAdminAction(adminId, "DISPUTE_RESOLUTION", {
    disputeId,
    decision: ruling,
    notes,
    amount: dispute.amount
  });

  return dispute;
}

export async function getPlatformControls() {
  return { ...platformControlsStore };
}

export async function togglePlatformControl(controlName, enabled, adminId) {
  if (controlName === "allowRegistrations") {
    platformControlsStore.allowRegistrations = Boolean(enabled);
  } else if (controlName === "allowJobPostings") {
    platformControlsStore.allowJobPostings = Boolean(enabled);
  } else {
    throw new Error(`Unknown platform control: ${controlName}`);
  }

  platformControlsStore.lastModifiedBy = adminId;
  platformControlsStore.lastModifiedAt = new Date().toISOString();

  logAdminAction(adminId, "PLATFORM_CONTROL_TOGGLE", {
    control: controlName,
    newValue: enabled
  });

  return { ...platformControlsStore };
}

export async function getAuditLogs({ actionType = "", page = 1, limit = 20 } = {}) {
  let filtered = [...auditLogsStore];
  if (actionType) {
    filtered = filtered.filter(l => l.actionType === actionType);
  }
  const offset = (page - 1) * limit;
  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page: Number(page),
    limit: Number(limit)
  };
}
