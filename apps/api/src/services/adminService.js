const users = [
  {
    id: "usr_1001",
    name: "Maya Rivera",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-04",
    profile: {
      headline: "Senior UI engineer",
      location: "Austin, TX",
      bio: "Designs marketplace interfaces and shipping flows.",
      trustScore: 92
    },
    activeJobTitles: ["Design review dashboard", "Email onboarding refresh", "Audit trail polish"],
    disputeHistory: ["Scope dispute over design handoff"],
    lastSeenAt: "2026-05-19"
  },
  {
    id: "usr_1002",
    name: "Jordan Cole",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18",
    profile: {
      headline: "Growth lead",
      location: "New York, NY",
      bio: "Hires specialists for product launches.",
      trustScore: 68
    },
    activeJobTitles: ["Analytics migration"],
    disputeHistory: [],
    lastSeenAt: "2026-05-17"
  },
  {
    id: "usr_1003",
    name: "Ava Chen",
    email: "ava@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-22",
    profile: {
      headline: "Founder and product owner",
      location: "San Francisco, CA",
      bio: "Runs a small product team and contracts specialists for launch work.",
      trustScore: 88
    },
    activeJobTitles: ["Build onboarding analytics", "Migrate billing notifications", "Design search revamp"],
    disputeHistory: ["Refund request for broken webhook"],
    lastSeenAt: "2026-05-20"
  },
  {
    id: "usr_1004",
    name: "Rafi Khan",
    email: "rafi@example.com",
    role: "freelancer",
    status: "flagged",
    joinedAt: "2026-05-02",
    profile: {
      headline: "Backend engineer",
      location: "Toronto, ON",
      bio: "Works on payment and messaging integrations.",
      trustScore: 74
    },
    activeJobTitles: ["Webhook recovery", "Notification retry fixes"],
    disputeHistory: ["Refund request for broken webhook"],
    lastSeenAt: "2026-05-19"
  },
  {
    id: "usr_1005",
    name: "Tessa Moore",
    email: "tessa@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-10",
    profile: {
      headline: "Operations manager",
      location: "Chicago, IL",
      bio: "Coordinates freelance delivery and vendor review.",
      trustScore: 81
    },
    activeJobTitles: ["Billing notification migration"],
    disputeHistory: [],
    lastSeenAt: "2026-05-18"
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
    updatedAt: "2026-05-18",
    thread: [
      { author: "maya@example.com", body: "Deliverables were approved but payment is still frozen.", at: "2026-05-18T08:15:00Z" },
      { author: "jordan@example.com", body: "The handoff missed two requested revisions.", at: "2026-05-18T08:42:00Z" }
    ],
    transaction: {
      id: "txn_7001",
      amount: "$1,200",
      currency: "USD",
      status: "pending"
    }
  },
  {
    id: "dsp_3002",
    title: "Refund request for broken webhook",
    parties: "ava@example.com vs rafi@example.com",
    status: "under_review",
    evidence: "Logs, failing CI, payment receipt",
    amount: "$850",
    updatedAt: "2026-05-19",
    thread: [
      { author: "ava@example.com", body: "The integration failed in staging and production.", at: "2026-05-19T10:05:00Z" },
      { author: "rafi@example.com", body: "I have a patch ready, but the refund seems premature.", at: "2026-05-19T10:21:00Z" }
    ],
    transaction: {
      id: "txn_7002",
      amount: "$850",
      currency: "USD",
      status: "captured"
    }
  },
  {
    id: "dsp_3003",
    title: "Late delivery settlement",
    parties: "maya@example.com vs tessa@example.com",
    status: "resolved",
    evidence: "Signed acceptance note, milestone screenshots, transaction receipt",
    amount: "$640",
    updatedAt: "2026-05-17",
    thread: [
      { author: "maya@example.com", body: "The milestone was completed and approved after mediation.", at: "2026-05-17T08:30:00Z" },
      { author: "tessa@example.com", body: "Agreed to settlement after reviewing the evidence.", at: "2026-05-17T09:05:00Z" }
    ],
    resolution: "Split settlement approved",
    transaction: {
      id: "txn_7003",
      amount: "$640",
      currency: "USD",
      status: "settled"
    }
  }
];

const notifications = [
  {
    id: "ntf_1",
    recipient: "Ava Chen",
    type: "job_flagged",
    detail: "Your listing was flagged for moderation review.",
    createdAt: "2026-05-20T09:00:00Z",
    status: "unread"
  },
  {
    id: "ntf_2",
    recipient: "Jordan Cole",
    type: "dispute_update",
    detail: "A dispute is under review by an admin.",
    createdAt: "2026-05-20T09:30:00Z",
    status: "unread"
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

function parseMoneyAmount(amount) {
  if (typeof amount !== "string") {
    return 0;
  }

  const numeric = Number(amount.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

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

function pushNotification(recipient, type, detail) {
  notifications.unshift({
    id: `ntf_${Date.now()}`,
    recipient,
    type,
    detail,
    createdAt: new Date().toISOString(),
    status: "unread"
  });
}

export async function getAdminMetrics() {
  const revenue = disputes.reduce((total, dispute) => {
    return dispute.transaction.status === "captured" || dispute.transaction.status === "settled"
      ? total + parseMoneyAmount(dispute.transaction.amount)
      : total;
  }, 0);

  return {
    totalUsers: users.length,
    activeJobs: jobs.filter((job) => job.status === "approved").length,
    openDisputes: disputes.filter((dispute) => dispute.status === "open").length,
    flaggedListings: jobs.filter((job) => job.status === "flagged").length,
    revenue,
    trustScoreBuckets: [
      { label: "90-100", count: 6 },
      { label: "80-89", count: 13 },
      { label: "70-79", count: 9 },
      { label: "Below 70", count: 2 }
    ]
  };
}

export async function listAdminUsers({ page, limit, role, status, query, joinedAfter, joinedBefore }) {
  const filtered = users.filter((user) => {
    if (role && user.role !== role) {
      return false;
    }

    if (status && user.status !== status) {
      return false;
    }

    if (query) {
      const haystack = `${user.name} ${user.email}`.toLowerCase();
      if (!haystack.includes(String(query).toLowerCase())) {
        return false;
      }
    }

    if (joinedAfter && user.joinedAt < String(joinedAfter)) {
      return false;
    }

    if (joinedBefore && user.joinedAt > String(joinedBefore)) {
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
    pushNotification(job.owner, "listing_rejected", `${job.title} was rejected${reason ? `: ${reason}` : ""}`);
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

  const [firstParty, secondParty] = dispute.parties.split(" vs ");
  const resolutionMessage = `${dispute.title} -> ${dispute.resolution ?? action}`;
  pushNotification(firstParty, "dispute_update", resolutionMessage);
  pushNotification(secondParty, "dispute_update", resolutionMessage);
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

export async function listAuditLog({ page, limit, admin, action, from, to }) {
  const filtered = auditLog.filter((entry) => {
    if (admin && entry.admin !== admin) {
      return false;
    }

    if (action && entry.action !== action) {
      return false;
    }

    if (from && entry.createdAt < String(from)) {
      return false;
    }

    if (to && entry.createdAt > String(to)) {
      return false;
    }

    return true;
  });

  return paginate(filtered, page, limit);
}

export async function listNotifications({ page, limit, recipient }) {
  const filtered = recipient
    ? notifications.filter((notification) =>
        notification.recipient.toLowerCase().includes(String(recipient).toLowerCase())
      )
    : notifications;

  return paginate(filtered, page, limit);
}
