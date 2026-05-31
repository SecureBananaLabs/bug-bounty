const users = [
  {
    id: "usr_admin_1",
    name: "Maya Chen",
    email: "maya@freelanceflow.test",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-04",
    trustScore: 98,
    profile: { location: "Toronto", verified: true, totalEarnings: 0 },
    activeJobs: [],
    disputeHistory: []
  },
  {
    id: "usr_free_1",
    name: "Ari Patel",
    email: "ari@freelanceflow.test",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-12",
    trustScore: 91,
    profile: { location: "Austin", verified: true, totalEarnings: 18400 },
    activeJobs: ["job_website_refresh"],
    disputeHistory: ["dsp_landing_refund"]
  },
  {
    id: "usr_client_1",
    name: "Northstar Labs",
    email: "ops@northstar.test",
    role: "client",
    status: "active",
    joinedAt: "2026-03-08",
    trustScore: 76,
    profile: { location: "Boston", verified: true, totalSpend: 42800 },
    activeJobs: ["job_website_refresh", "job_data_pipeline"],
    disputeHistory: ["dsp_landing_refund"]
  },
  {
    id: "usr_client_2",
    name: "LaunchBox Studio",
    email: "hello@launchbox.test",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18",
    trustScore: 42,
    profile: { location: "Remote", verified: false, totalSpend: 3100 },
    activeJobs: [],
    disputeHistory: ["dsp_logo_scope"]
  }
];

const flaggedJobs = [
  {
    id: "job_website_refresh",
    title: "Website refresh and Webflow migration",
    clientId: "usr_client_1",
    clientName: "Northstar Labs",
    status: "flagged",
    flaggedAt: "2026-05-15T10:30:00Z",
    reason: "Repeated off-platform payment language",
    riskLevel: "medium"
  },
  {
    id: "job_crypto_clone",
    title: "Clone trading dashboard in 24 hours",
    clientId: "usr_client_2",
    clientName: "LaunchBox Studio",
    status: "escalated",
    flaggedAt: "2026-05-16T13:12:00Z",
    reason: "High-risk financial claims and unrealistic delivery",
    riskLevel: "high"
  },
  {
    id: "job_data_pipeline",
    title: "Analytics pipeline for marketplace data",
    clientId: "usr_client_1",
    clientName: "Northstar Labs",
    status: "approved",
    flaggedAt: "2026-05-14T09:00:00Z",
    reason: "Keyword false positive",
    riskLevel: "low"
  }
];

const disputes = [
  {
    id: "dsp_landing_refund",
    jobTitle: "Landing page conversion audit",
    freelancerId: "usr_free_1",
    freelancerName: "Ari Patel",
    clientId: "usr_client_1",
    clientName: "Northstar Labs",
    status: "open",
    transaction: { id: "txn_1001", amount: 2400, currency: "usd", escrowStatus: "held" },
    thread: [
      "Client reports the deliverable missed the requested mobile QA pass.",
      "Freelancer attached before/after screenshots and Lighthouse output."
    ],
    evidence: ["mobile-qa-report.pdf", "lighthouse-before-after.zip"],
    ruling: null
  },
  {
    id: "dsp_logo_scope",
    jobTitle: "Brand kit and logo refresh",
    freelancerId: "usr_free_2",
    freelancerName: "Ivy Gomez",
    clientId: "usr_client_2",
    clientName: "LaunchBox Studio",
    status: "under_review",
    transaction: { id: "txn_1002", amount: 900, currency: "usd", escrowStatus: "held" },
    thread: [
      "Freelancer says the third revision exceeded scope.",
      "Client uploaded the original milestone wording."
    ],
    evidence: ["revision-history.json", "milestone-contract.pdf"],
    ruling: null
  }
];

const notifications = [];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true,
  payoutProcessingEnabled: true,
  maintenanceMode: false
};

function clone(value) {
  return structuredClone(value);
}

function matchesDateRange(date, joinedFrom, joinedTo) {
  if (joinedFrom && date < joinedFrom) return false;
  if (joinedTo && date > joinedTo) return false;
  return true;
}

function trustDistribution() {
  return [
    { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { label: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
    { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
  ];
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: flaggedJobs.filter((job) => job.status !== "rejected").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: disputes.reduce((total, dispute) => total + dispute.transaction.amount, 0)
  };
}

export async function getAdminDashboard() {
  return {
    metrics: await getAdminMetrics(),
    trustDistribution: trustDistribution(),
    controls: clone(platformControls),
    queues: {
      users: users.filter((user) => user.status !== "active").length,
      moderation: flaggedJobs.filter((job) => ["flagged", "escalated"].includes(job.status)).length,
      disputes: disputes.filter((dispute) => dispute.status !== "resolved").length
    },
    recentNotifications: clone(notifications.slice(-5).reverse())
  };
}

export async function listAdminUsers(filters = {}) {
  const search = filters.search?.toLowerCase();
  return clone(
    users.filter((user) => {
      if (search && !`${user.name} ${user.email}`.toLowerCase().includes(search)) return false;
      if (filters.role && user.role !== filters.role) return false;
      if (filters.status && user.status !== filters.status) return false;
      return matchesDateRange(user.joinedAt, filters.joinedFrom, filters.joinedTo);
    })
  );
}

export async function updateUserStatus(userId, action) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  const nextStatusByAction = {
    suspend: "suspended",
    reinstate: "active",
    ban: "banned"
  };
  const nextStatus = nextStatusByAction[action];
  if (!nextStatus) {
    throw new Error("Unsupported user moderation action");
  }

  user.status = nextStatus;
  return clone(user);
}

export async function listFlaggedJobs(filters = {}) {
  return clone(
    flaggedJobs.filter((job) => {
      if (filters.status && job.status !== filters.status) return false;
      if (filters.riskLevel && job.riskLevel !== filters.riskLevel) return false;
      return true;
    })
  );
}

export async function moderateFlaggedJob(jobId, payload) {
  const job = flaggedJobs.find((candidate) => candidate.id === jobId);
  if (!job) return null;

  const allowedActions = new Set(["approve", "reject", "escalate"]);
  if (!allowedActions.has(payload.action)) {
    throw new Error("Unsupported listing moderation action");
  }

  job.status = payload.action === "approve" ? "approved" : payload.action === "reject" ? "rejected" : "escalated";
  job.resolutionReason = payload.reason ?? "";

  if (payload.action === "reject") {
    notifications.push({
      id: `ntf_${notifications.length + 1}`,
      userId: job.clientId,
      type: "listing_rejected",
      message: `Your listing \"${job.title}\" was rejected: ${job.resolutionReason || "policy review failed"}`,
      createdAt: new Date().toISOString()
    });
  }

  return clone(job);
}

export async function listDisputes(filters = {}) {
  return clone(disputes.filter((dispute) => !filters.status || dispute.status === filters.status));
}

export async function ruleOnDispute(disputeId, payload) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) return null;

  const allowedRulings = new Set(["freelancer", "client", "refund", "escalate"]);
  if (!allowedRulings.has(payload.ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  dispute.ruling = {
    outcome: payload.ruling,
    reason: payload.reason ?? "",
    ruledAt: new Date().toISOString()
  };
  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";

  notifications.push(
    {
      id: `ntf_${notifications.length + 1}`,
      userId: dispute.clientId,
      type: "dispute_update",
      message: `Dispute ${dispute.id} was updated with outcome ${payload.ruling}.`,
      createdAt: new Date().toISOString()
    },
    {
      id: `ntf_${notifications.length + 2}`,
      userId: dispute.freelancerId,
      type: "dispute_update",
      message: `Dispute ${dispute.id} was updated with outcome ${payload.ruling}.`,
      createdAt: new Date().toISOString()
    }
  );

  return clone(dispute);
}

export async function getPlatformControls() {
  return clone(platformControls);
}

export async function updatePlatformControl(key, enabled) {
  if (!(key in platformControls)) {
    return null;
  }

  platformControls[key] = Boolean(enabled);
  return clone(platformControls);
}

export async function listAdminNotifications() {
  return clone(notifications);
}
