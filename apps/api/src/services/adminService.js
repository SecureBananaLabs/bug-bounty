const users = [
  {
    id: "usr_client_1",
    email: "client@example.com",
    fullName: "Mara Client",
    role: "client",
    status: "active",
    joinedAt: "2026-04-02T09:30:00.000Z",
    activeJobs: 3,
    disputes: 1
  },
  {
    id: "usr_freelancer_1",
    email: "freelancer@example.com",
    fullName: "Nico Freelancer",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-12T14:15:00.000Z",
    activeJobs: 2,
    disputes: 0
  },
  {
    id: "usr_freelancer_2",
    email: "flagged@example.com",
    fullName: "Avery Flagged",
    role: "freelancer",
    status: "suspended",
    joinedAt: "2026-05-01T11:00:00.000Z",
    activeJobs: 0,
    disputes: 2
  }
];

const flaggedListings = [
  {
    id: "flag_101",
    jobId: "job-101",
    title: "Build an AI customer support widget",
    clientId: "usr_client_1",
    reason: "Payment terms mention off-platform escrow",
    severity: "high",
    status: "pending",
    reportedAt: "2026-05-20T18:20:00.000Z"
  },
  {
    id: "flag_102",
    jobId: "job-103",
    title: "Design SaaS onboarding flows",
    clientId: "usr_client_1",
    reason: "Duplicate listing reported by freelancer",
    severity: "medium",
    status: "pending",
    reportedAt: "2026-05-23T08:10:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_201",
    jobId: "job-101",
    title: "Milestone delivery disagreement",
    freelancerId: "usr_freelancer_1",
    clientId: "usr_client_1",
    amount: 1200,
    status: "open",
    evidence: ["contract.pdf", "handoff-notes.md"],
    thread: [
      { author: "client", body: "Milestone 2 was incomplete." },
      { author: "freelancer", body: "The acceptance checklist was met." }
    ]
  },
  {
    id: "dsp_202",
    jobId: "job-103",
    title: "Refund request for design sprint",
    freelancerId: "usr_freelancer_2",
    clientId: "usr_client_1",
    amount: 450,
    status: "under_review",
    evidence: ["figma-export.zip"],
    thread: [
      { author: "client", body: "Assets were not delivered in editable form." }
    ]
  }
];

const platformControls = {
  registrationsEnabled: true,
  jobPostingEnabled: true
};

const notifications = [];
const auditLog = [
  {
    id: "aud_100",
    adminId: "system",
    action: "seed",
    targetType: "admin",
    targetId: "bootstrap",
    details: "Initial admin demo data loaded",
    createdAt: "2026-05-17T05:53:20.000Z"
  }
];

function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const total = items.length;
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(Math.ceil(total / safePageSize), 1)
  };
}

function contains(value, query) {
  return String(value).toLowerCase().includes(String(query).toLowerCase());
}

function appendAudit(adminId, action, targetType, targetId, details) {
  const entry = {
    id: `aud_${auditLog.length + 101}`,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };

  auditLog.unshift(entry);
  return entry;
}

function notifyUser(userId, title, body) {
  notifications.unshift({
    id: `ntf_${notifications.length + 1}`,
    userId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString()
  });
}

export async function getAdminMetrics() {
  const activeJobs = flaggedListings.filter((listing) => listing.status === "approved").length + 42;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedOpen = flaggedListings.filter((listing) => listing.status === "pending").length;

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings: flaggedOpen,
    revenueCurrentPeriod: 128900,
    trustDistribution: [
      { band: "90-100", users: 142 },
      { band: "70-89", users: 35 },
      { band: "50-69", users: 7 },
      { band: "<50", users: 1 }
    ],
    controls: { ...platformControls },
    notificationsQueued: notifications.length
  };
}

export async function listAdminUsers(filters = {}) {
  const { search = "", role, status, joinedFrom, joinedTo } = filters;
  const normalizedRole = role ? String(role).toLowerCase() : "";
  const normalizedStatus = status ? String(status).toLowerCase() : "";

  const filtered = users.filter((user) => {
    const matchesSearch = !search || contains(user.email, search) || contains(user.fullName, search);
    const matchesRole = !normalizedRole || user.role === normalizedRole;
    const matchesStatus = !normalizedStatus || user.status === normalizedStatus;
    const joined = new Date(user.joinedAt).getTime();
    const afterStart = !joinedFrom || joined >= new Date(joinedFrom).getTime();
    const beforeEnd = !joinedTo || joined <= new Date(joinedTo).getTime();

    return matchesSearch && matchesRole && matchesStatus && afterStart && beforeEnd;
  });

  return paginate(filtered, filters);
}

export async function updateUserStatus(userId, status, adminId) {
  const user = users.find((candidate) => candidate.id === userId);
  const normalizedStatus = String(status).toLowerCase();

  if (!user) {
    return null;
  }

  if (!["active", "suspended", "banned"].includes(normalizedStatus)) {
    throw new Error("Unsupported user status");
  }

  user.status = normalizedStatus;
  appendAudit(adminId, `user.${normalizedStatus}`, "user", userId, `${user.email} set to ${normalizedStatus}`);
  notifyUser(userId, "Account status updated", `Your account status changed to ${normalizedStatus}.`);

  return user;
}

export async function listFlaggedListings(filters = {}) {
  const { status, severity } = filters;
  const filtered = flaggedListings.filter((listing) => {
    const matchesStatus = !status || listing.status === String(status).toLowerCase();
    const matchesSeverity = !severity || listing.severity === String(severity).toLowerCase();

    return matchesStatus && matchesSeverity;
  });

  return paginate(filtered, filters);
}

export async function decideFlaggedListing(listingId, decision, reason, adminId) {
  const listing = flaggedListings.find((candidate) => candidate.id === listingId);
  const normalizedDecision = String(decision).toLowerCase();

  if (!listing) {
    return null;
  }

  if (!["approved", "rejected", "escalated"].includes(normalizedDecision)) {
    throw new Error("Unsupported listing decision");
  }

  listing.status = normalizedDecision;
  listing.resolutionReason = reason || null;
  appendAudit(adminId, `listing.${normalizedDecision}`, "listing", listingId, reason || "No reason provided");

  if (normalizedDecision === "rejected") {
    notifyUser(listing.clientId, "Listing rejected", reason || "Your listing did not pass moderation.");
  }

  return listing;
}

export async function listDisputes(filters = {}) {
  const { status } = filters;
  const filtered = disputes.filter((dispute) => !status || dispute.status === String(status).toLowerCase());

  return paginate(filtered, filters);
}

export async function ruleOnDispute(disputeId, ruling, adminId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  const normalizedRuling = String(ruling).toLowerCase();

  if (!dispute) {
    return null;
  }

  if (!["client", "freelancer", "refund", "escalate"].includes(normalizedRuling)) {
    throw new Error("Unsupported dispute ruling");
  }

  dispute.status = normalizedRuling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = normalizedRuling;
  appendAudit(adminId, `dispute.${normalizedRuling}`, "dispute", disputeId, `Ruling: ${normalizedRuling}`);
  notifyUser(dispute.clientId, "Dispute updated", `Admin ruling: ${normalizedRuling}.`);
  notifyUser(dispute.freelancerId, "Dispute updated", `Admin ruling: ${normalizedRuling}.`);

  return dispute;
}

export async function getPlatformControls() {
  return { ...platformControls };
}

export async function updatePlatformControl(control, enabled, adminId) {
  if (!Object.prototype.hasOwnProperty.call(platformControls, control)) {
    throw new Error("Unsupported platform control");
  }

  platformControls[control] = Boolean(enabled);
  appendAudit(adminId, `control.${control}`, "platform", control, `${control} set to ${platformControls[control]}`);

  return { ...platformControls };
}

export async function listAuditLog(filters = {}) {
  const { adminId, action, from, to } = filters;
  const filtered = auditLog.filter((entry) => {
    const created = new Date(entry.createdAt).getTime();
    const matchesAdmin = !adminId || entry.adminId === adminId;
    const matchesAction = !action || entry.action === action;
    const afterStart = !from || created >= new Date(from).getTime();
    const beforeEnd = !to || created <= new Date(to).getTime();

    return matchesAdmin && matchesAction && afterStart && beforeEnd;
  });

  return paginate(filtered, filters);
}
