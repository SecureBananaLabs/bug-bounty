const users = [
  {
    id: "usr_1001",
    name: "Maya Rivera",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-04"
  },
  {
    id: "usr_1002",
    name: "Jordan Cole",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18"
  },
  {
    id: "usr_1003",
    name: "Ava Chen",
    email: "ava@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-22"
  },
  {
    id: "usr_1004",
    name: "Rafi Khan",
    email: "rafi@example.com",
    role: "freelancer",
    status: "flagged",
    joinedAt: "2026-05-02"
  },
  {
    id: "usr_1005",
    name: "Tessa Moore",
    email: "tessa@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-10"
  }
];

const jobs = [
  {
    id: "job_2001",
    title: "Build onboarding analytics",
    owner: "Ava Chen",
    status: "flagged",
    reason: "Budget mismatch and vague deliverables",
    updatedAt: "2026-05-18"
  },
  {
    id: "job_2002",
    title: "Design freelancer search revamp",
    owner: "Jordan Cole",
    status: "approved",
    reason: null,
    updatedAt: "2026-05-16"
  },
  {
    id: "job_2003",
    title: "Migrate billing notifications",
    owner: "Tessa Moore",
    status: "escalated",
    reason: "Possible duplicate report",
    updatedAt: "2026-05-19"
  }
];

const disputes = [
  {
    id: "dsp_3001",
    title: "Scope dispute over design handoff",
    parties: "maya@example.com vs jordan@example.com",
    status: "open",
    evidence: "Screenshots, chat transcript, milestone deliverables",
    amount: "$1,200",
    updatedAt: "2026-05-18"
  },
  {
    id: "dsp_3002",
    title: "Refund request for broken webhook",
    parties: "ava@example.com vs rafi@example.com",
    status: "under_review",
    evidence: "Logs, failing CI, payment receipt",
    amount: "$850",
    updatedAt: "2026-05-19"
  }
];

const auditLog = [
  {
    id: "aud_1",
    admin: "root-admin",
    action: "suspend_user",
    detail: "Suspended usr_1002 for repeated spam reports",
    createdAt: "2026-05-19T09:42:00Z"
  },
  {
    id: "aud_2",
    admin: "root-admin",
    action: "reject_job",
    detail: "Rejected job_2001 due to low quality scope",
    createdAt: "2026-05-20T11:10:00Z"
  }
];

const settings = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

function paginate(items, page, limit) {
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);
  return {
    items: pageItems,
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit))
  };
}

function logAction(adminId, action, detail) {
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    admin: adminId,
    action,
    detail,
    createdAt: new Date().toISOString()
  });
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "approved").length,
    openDisputes: disputes.filter((dispute) => dispute.status === "open").length,
    flaggedListings: jobs.filter((job) => job.status === "flagged").length,
    revenue: 128900,
    trustScoreBuckets: [
      { label: "90-100", count: 6 },
      { label: "80-89", count: 13 },
      { label: "70-79", count: 9 },
      { label: "Below 70", count: 2 }
    ]
  };
}

export async function listAdminUsers({ page, limit, role, status }) {
  const filtered = users.filter((user) => {
    if (role && user.role !== role) {
      return false;
    }

    if (status && user.status !== status) {
      return false;
    }

    return true;
  });

  return paginate(filtered, page, limit);
}

export async function updateUserStatus(userId, action, adminId) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return null;
  }

  if (action === "suspend") {
    user.status = "suspended";
  } else if (action === "reinstate") {
    user.status = "active";
  } else if (action === "ban") {
    user.status = "banned";
  }

  logAction(adminId, `${action}_user`, `${action} ${userId}`);
  return user;
}

export async function listAdminJobs({ page, limit, status }) {
  const filtered = status ? jobs.filter((job) => job.status === status) : jobs;
  return paginate(filtered, page, limit);
}

export async function updateJobStatus(jobId, action, reason, adminId) {
  const job = jobs.find((item) => item.id === jobId);
  if (!job) {
    return null;
  }

  if (action === "approve") {
    job.status = "approved";
    job.reason = null;
  } else if (action === "reject") {
    job.status = "rejected";
    job.reason = reason ?? "Rejected by admin";
  } else if (action === "escalate") {
    job.status = "escalated";
    job.reason = reason ?? job.reason;
  }

  logAction(adminId, `${action}_job`, `${action} ${jobId}${reason ? `: ${reason}` : ""}`);
  return job;
}

export async function listAdminDisputes({ page, limit, status }) {
  const filtered = status ? disputes.filter((dispute) => dispute.status === status) : disputes;
  return paginate(filtered, page, limit);
}

export async function updateDisputeStatus(disputeId, action, reason, adminId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) {
    return null;
  }

  if (action === "rule_freelancer") {
    dispute.status = "resolved";
    dispute.resolution = "Freelancer favored";
  } else if (action === "rule_client") {
    dispute.status = "resolved";
    dispute.resolution = "Client favored";
  } else if (action === "refund") {
    dispute.status = "resolved";
    dispute.resolution = "Refund issued";
  } else if (action === "escalate") {
    dispute.status = "under_review";
    dispute.resolution = reason ?? "Escalated to senior admin";
  }

  logAction(adminId, `${action}_dispute`, `${action} ${disputeId}${reason ? `: ${reason}` : ""}`);
  return dispute;
}

export async function getPlatformSettings() {
  return { ...settings };
}

export async function updatePlatformSettings(patch, adminId) {
  if (typeof patch.registrationsEnabled === "boolean") {
    settings.registrationsEnabled = patch.registrationsEnabled;
  }

  if (typeof patch.jobPostingsEnabled === "boolean") {
    settings.jobPostingsEnabled = patch.jobPostingsEnabled;
  }

  logAction(adminId, "update_settings", JSON.stringify(patch));
  return { ...settings };
}

export async function listAuditLog({ page, limit, admin, action }) {
  const filtered = auditLog.filter((entry) => {
    if (admin && entry.admin !== admin) {
      return false;
    }

    if (action && entry.action !== action) {
      return false;
    }

    return true;
  });

  return paginate(filtered, page, limit);
}
