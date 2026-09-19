const users = [
  {
    id: "usr_ada",
    name: "Ada R.",
    email: "ada@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-01-12",
    trustScore: 92,
    activeJobs: 3,
    disputes: 0
  },
  {
    id: "usr_miles",
    name: "Miles K.",
    email: "miles@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-02-03",
    trustScore: 76,
    activeJobs: 5,
    disputes: 1
  },
  {
    id: "usr_sana",
    name: "Sana P.",
    email: "sana@example.com",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-03-18",
    trustScore: 41,
    activeJobs: 1,
    disputes: 2
  },
  {
    id: "usr_orion",
    name: "Orion Studio",
    email: "ops@orion.example",
    role: "client",
    status: "banned",
    joinedAt: "2026-04-01",
    trustScore: 22,
    activeJobs: 0,
    disputes: 4
  },
  {
    id: "usr_nia",
    name: "Nia L.",
    email: "nia@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-21",
    trustScore: 88,
    activeJobs: 2,
    disputes: 0
  }
];

const moderationQueue = [
  {
    id: "job_brand_audit",
    title: "Brand audit for fintech launch",
    posterId: "usr_miles",
    status: "flagged",
    reason: "High-value listing missing verified payment method",
    reportedAt: "2026-05-18T10:20:00.000Z"
  },
  {
    id: "job_scraper",
    title: "Bulk scrape competitor profiles",
    posterId: "usr_orion",
    status: "flagged",
    reason: "Automated policy flag for prohibited data collection",
    reportedAt: "2026-05-19T15:05:00.000Z"
  },
  {
    id: "job_rebrand",
    title: "Luxury rebrand production sprint",
    posterId: "usr_miles",
    status: "escalated",
    reason: "Budget mismatch and contract ambiguity",
    reportedAt: "2026-05-20T08:45:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_1001",
    clientId: "usr_miles",
    freelancerId: "usr_sana",
    status: "open",
    value: 4800,
    currency: "gbp",
    subject: "Milestone delivery dispute",
    evidence: ["contract-v4.pdf", "delivery-thread.txt"],
    thread: ["Client reports late delivery", "Freelancer supplied partial files"]
  },
  {
    id: "dsp_1002",
    clientId: "usr_orion",
    freelancerId: "usr_ada",
    status: "under_review",
    value: 1250,
    currency: "gbp",
    subject: "Refund request after approved draft",
    evidence: ["approved-draft.png", "invoice-882.pdf"],
    thread: ["Draft accepted", "Refund requested after usage"]
  }
];

const settings = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const notifications = [];
const auditLog = [
  {
    id: "aud_seed_1",
    adminId: "system",
    action: "settings.seeded",
    targetId: "platform",
    createdAt: "2026-05-20T08:00:00.000Z",
    details: "Initial admin mock state loaded"
  }
];

function paginate(items, page = 1, pageSize = 10) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 10, 1), 50);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / safePageSize), 1)
  };
}

function adminIdFrom(user) {
  return user?.sub ?? user?.id ?? "admin_unknown";
}

function logAction(adminId, action, targetId, details) {
  const entry = {
    id: `aud_${auditLog.length + 1}`,
    adminId,
    action,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };

  auditLog.push(entry);
  return entry;
}

function notify(userId, message) {
  notifications.push({
    id: `ntf_${notifications.length + 1}`,
    userId,
    message,
    createdAt: new Date().toISOString()
  });
}

function findById(collection, id, label) {
  const item = collection.find((entry) => entry.id === id);
  if (!item) {
    const error = new Error(`${label} not found`);
    error.statusCode = 404;
    throw error;
  }
  return item;
}

function trustDistribution() {
  return [
    { label: "0-39", count: users.filter((user) => user.trustScore < 40).length },
    { label: "40-69", count: users.filter((user) => user.trustScore >= 40 && user.trustScore < 70).length },
    { label: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { label: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];
}

export async function getAdminOverview() {
  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: moderationQueue.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: trustDistribution(),
    settings
  };
}

export async function listUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch =
      !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesJoinedAfter = !query.joinedAfter || user.joinedAt >= query.joinedAfter;
    return matchesSearch && matchesRole && matchesStatus && matchesJoinedAfter;
  });

  return paginate(filtered, query.page, query.pageSize);
}

export async function getUserProfile(userId) {
  const user = findById(users, userId, "User");
  return {
    ...user,
    activeJobs: moderationQueue.filter((job) => job.posterId === userId),
    disputeHistory: disputes.filter((dispute) => dispute.clientId === userId || dispute.freelancerId === userId)
  };
}

export async function updateUserStatus(userId, status, adminUser) {
  if (!["active", "suspended", "banned"].includes(status)) {
    const error = new Error("User status must be active, suspended, or banned");
    error.statusCode = 400;
    throw error;
  }

  const user = findById(users, userId, "User");
  user.status = status;
  const audit = logAction(adminIdFrom(adminUser), `user.${status}`, userId, `User ${user.email} set to ${status}`);

  return { user, audit };
}

export async function listModerationQueue(query = {}) {
  const filtered = moderationQueue.filter((job) => !query.status || job.status === query.status);
  return paginate(filtered, query.page, query.pageSize);
}

export async function decideListing(listingId, decision, reason, adminUser) {
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    const error = new Error("Listing decision must be approved, rejected, or escalated");
    error.statusCode = 400;
    throw error;
  }

  const listing = findById(moderationQueue, listingId, "Listing");
  listing.status = decision;
  listing.resolutionReason = reason ?? "No reason provided";

  if (decision === "rejected") {
    notify(listing.posterId, `Your listing \"${listing.title}\" was rejected: ${listing.resolutionReason}`);
  }

  const audit = logAction(
    adminIdFrom(adminUser),
    `listing.${decision}`,
    listingId,
    `${listing.title}: ${listing.resolutionReason}`
  );

  return { listing, audit };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query.page, query.pageSize);
}

export async function ruleDispute(disputeId, ruling, adminUser) {
  if (!["client", "freelancer", "refund", "senior_admin"].includes(ruling)) {
    const error = new Error("Dispute ruling must be client, freelancer, refund, or senior_admin");
    error.statusCode = 400;
    throw error;
  }

  const dispute = findById(disputes, disputeId, "Dispute");
  dispute.status = ruling === "senior_admin" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  notify(dispute.clientId, `Dispute ${dispute.id} updated with ruling: ${ruling}`);
  notify(dispute.freelancerId, `Dispute ${dispute.id} updated with ruling: ${ruling}`);

  const audit = logAction(adminIdFrom(adminUser), `dispute.${ruling}`, disputeId, dispute.subject);
  return { dispute, audit };
}

export async function getPlatformSettings() {
  return settings;
}

export async function updatePlatformSetting(setting, enabled, adminUser) {
  if (!["registrationsEnabled", "jobPostingEnabled"].includes(setting)) {
    const error = new Error("Unknown platform setting");
    error.statusCode = 400;
    throw error;
  }

  settings[setting] = Boolean(enabled);
  const audit = logAction(adminIdFrom(adminUser), `setting.${setting}`, "platform", `${setting} set to ${settings[setting]}`);
  return { settings, audit };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.action || entry.action.includes(query.action);
    const matchesFrom = !query.from || entry.createdAt >= query.from;
    const matchesTo = !query.to || entry.createdAt <= query.to;
    return matchesAdmin && matchesAction && matchesFrom && matchesTo;
  });

  return paginate(filtered.slice().reverse(), query.page, query.pageSize);
}
