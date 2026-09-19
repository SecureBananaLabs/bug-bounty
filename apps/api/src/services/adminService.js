const users = [
  {
    id: "usr_admin_1",
    email: "ops-admin@freelanceflow.test",
    fullName: "Nora Admin",
    role: "admin",
    status: "active",
    trustScore: 96,
    joinedAt: "2025-12-11T10:00:00.000Z",
    activeJobs: 0,
    disputeHistory: []
  },
  {
    id: "usr_client_1",
    email: "maya.client@example.com",
    fullName: "Maya Chen",
    role: "client",
    status: "active",
    trustScore: 88,
    joinedAt: "2026-01-14T09:35:00.000Z",
    activeJobs: 3,
    disputeHistory: ["dsp_1"]
  },
  {
    id: "usr_freelancer_1",
    email: "sam.builder@example.com",
    fullName: "Sam Rivera",
    role: "freelancer",
    status: "suspended",
    trustScore: 61,
    joinedAt: "2026-02-02T14:20:00.000Z",
    activeJobs: 1,
    disputeHistory: ["dsp_1", "dsp_2"]
  },
  {
    id: "usr_client_2",
    email: "oliver.ops@example.com",
    fullName: "Oliver Grant",
    role: "client",
    status: "active",
    trustScore: 73,
    joinedAt: "2026-03-19T08:10:00.000Z",
    activeJobs: 2,
    disputeHistory: []
  },
  {
    id: "usr_freelancer_2",
    email: "rhea.design@example.com",
    fullName: "Rhea Patel",
    role: "freelancer",
    status: "active",
    trustScore: 92,
    joinedAt: "2026-04-07T12:45:00.000Z",
    activeJobs: 4,
    disputeHistory: []
  }
];

const flaggedListings = [
  {
    id: "flg_1",
    jobId: "job_101",
    title: "Scrape competitor pricing daily",
    clientId: "usr_client_1",
    clientName: "Maya Chen",
    budget: 1200,
    reason: "Automated data collection risk",
    status: "flagged",
    reportedAt: "2026-05-16T11:20:00.000Z",
    automatedFlags: ["scraping", "terms-risk"]
  },
  {
    id: "flg_2",
    jobId: "job_118",
    title: "AI outreach system for 40k contacts",
    clientId: "usr_client_2",
    clientName: "Oliver Grant",
    budget: 2500,
    reason: "Bulk outreach compliance review",
    status: "flagged",
    reportedAt: "2026-05-17T15:05:00.000Z",
    automatedFlags: ["bulk-email", "compliance"]
  }
];

const disputes = [
  {
    id: "dsp_1",
    status: "open",
    clientId: "usr_client_1",
    clientName: "Maya Chen",
    freelancerId: "usr_freelancer_1",
    freelancerName: "Sam Rivera",
    jobId: "job_101",
    amount: 900,
    openedAt: "2026-05-15T12:00:00.000Z",
    transaction: { paymentId: "pay_101", escrowStatus: "held", currency: "USD" },
    evidence: ["scope_change.pdf", "handoff_recording.mp4"],
    thread: [
      { author: "client", body: "The automation broke after the second test run.", createdAt: "2026-05-15T12:03:00.000Z" },
      { author: "freelancer", body: "The credentials changed after delivery.", createdAt: "2026-05-15T12:18:00.000Z" }
    ]
  },
  {
    id: "dsp_2",
    status: "under_review",
    clientId: "usr_client_2",
    clientName: "Oliver Grant",
    freelancerId: "usr_freelancer_1",
    freelancerName: "Sam Rivera",
    jobId: "job_118",
    amount: 450,
    openedAt: "2026-05-13T16:30:00.000Z",
    transaction: { paymentId: "pay_118", escrowStatus: "held", currency: "USD" },
    evidence: ["qa_notes.md"],
    thread: [
      { author: "client", body: "Deliverables are missing the Zapier handoff.", createdAt: "2026-05-13T16:31:00.000Z" }
    ]
  }
];

const platformControls = {
  registrations: { enabled: true, label: "New user registrations" },
  jobPostings: { enabled: true, label: "New job postings" }
};

const notifications = [];
const auditLog = [
  {
    id: "aud_1",
    adminId: "usr_admin_1",
    actionType: "platform.review",
    targetId: "flg_1",
    message: "Flagged listing entered moderation queue",
    createdAt: "2026-05-16T11:20:00.000Z"
  }
];

function now() {
  return new Date().toISOString();
}

function writeAudit(adminId, actionType, targetId, message, metadata = {}) {
  const event = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetId,
    message,
    metadata,
    createdAt: now()
  };
  auditLog.unshift(event);
  return event;
}

function createNotification(userId, title, body) {
  const notification = {
    id: `ntf_${Date.now()}_${notifications.length + 1}`,
    userId,
    title,
    body,
    read: false,
    createdAt: now()
  };
  notifications.unshift(notification);
  return notification;
}

function pageInput(query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = pageInput(query);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function includes(value, query) {
  return String(value).toLowerCase().includes(String(query).toLowerCase());
}

export async function getAdminMetrics() {
  const statusCounts = users.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: users.length,
    activeJobs: users.reduce((total, user) => total + user.activeJobs, 0),
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedListings.filter((listing) => listing.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    userStatusCounts: statusCounts,
    trustScoreDistribution: [
      { range: "0-49", count: users.filter((user) => user.trustScore < 50).length },
      { range: "50-69", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
      { range: "70-89", count: users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
      { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
    ]
  };
}

export async function listAdminUsers(query) {
  let result = [...users];

  if (query.role) {
    result = result.filter((user) => user.role === query.role);
  }
  if (query.status) {
    result = result.filter((user) => user.status === query.status);
  }
  if (query.q) {
    result = result.filter((user) => includes(user.fullName, query.q) || includes(user.email, query.q));
  }
  if (query.joinedFrom) {
    result = result.filter((user) => new Date(user.joinedAt) >= new Date(query.joinedFrom));
  }
  if (query.joinedTo) {
    result = result.filter((user) => new Date(user.joinedAt) <= new Date(query.joinedTo));
  }

  return paginate(result, query);
}

export async function getAdminUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;
  return {
    ...user,
    profile: {
      activeJobs: user.activeJobs,
      disputeHistory: disputes.filter((dispute) => dispute.clientId === userId || dispute.freelancerId === userId)
    }
  };
}

export async function updateUserStatus(userId, status, adminId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  user.status = status;
  user.updatedAt = now();
  const audit = writeAudit(adminId, `user.${status}`, userId, `User ${user.email} marked ${status}`);
  return { user, audit };
}

export async function listModerationQueue(query) {
  let result = [...flaggedListings];
  if (query.status) {
    result = result.filter((listing) => listing.status === query.status);
  }
  if (query.q) {
    result = result.filter((listing) => includes(listing.title, query.q) || includes(listing.reason, query.q));
  }
  return paginate(result, query);
}

export async function decideListing(listingId, decision, reason, adminId) {
  const listing = flaggedListings.find((candidate) => candidate.id === listingId);
  if (!listing) return null;

  listing.status = decision;
  listing.decisionReason = reason;
  listing.reviewedAt = now();
  const audit = writeAudit(adminId, `listing.${decision}`, listingId, `Listing ${listing.title} marked ${decision}`, { reason });
  const notification = decision === "rejected"
    ? createNotification(listing.clientId, "Listing rejected", reason || "Your listing did not pass moderation.")
    : null;

  return { listing, audit, notification };
}

export async function listDisputes(query) {
  let result = [...disputes];
  if (query.status) {
    result = result.filter((dispute) => dispute.status === query.status);
  }
  if (query.q) {
    result = result.filter((dispute) => includes(dispute.clientName, query.q) || includes(dispute.freelancerName, query.q) || includes(dispute.jobId, query.q));
  }
  return paginate(result, query);
}

export async function getDispute(disputeId) {
  return disputes.find((candidate) => candidate.id === disputeId) ?? null;
}

export async function ruleDispute(disputeId, ruling, adminId, note = "") {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) return null;

  dispute.status = ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = ruling;
  dispute.rulingNote = note;
  dispute.resolvedAt = now();

  const audit = writeAudit(adminId, `dispute.${ruling}`, disputeId, `Dispute ${disputeId} ruled ${ruling}`, { note });
  const clientNotification = createNotification(dispute.clientId, "Dispute update", `Admin ruling: ${ruling}. ${note}`);
  const freelancerNotification = createNotification(dispute.freelancerId, "Dispute update", `Admin ruling: ${ruling}. ${note}`);

  return { dispute, audit, notifications: [clientNotification, freelancerNotification] };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(key, enabled, adminId) {
  if (!platformControls[key]) return null;

  platformControls[key].enabled = Boolean(enabled);
  platformControls[key].updatedAt = now();
  const audit = writeAudit(adminId, `control.${key}`, key, `${platformControls[key].label} set to ${platformControls[key].enabled ? "enabled" : "disabled"}`);
  return { control: platformControls[key], audit };
}

export async function listAuditLog(query) {
  let result = [...auditLog];
  if (query.adminId) {
    result = result.filter((entry) => entry.adminId === query.adminId);
  }
  if (query.actionType) {
    result = result.filter((entry) => entry.actionType === query.actionType || entry.actionType.startsWith(`${query.actionType}.`));
  }
  if (query.from) {
    result = result.filter((entry) => new Date(entry.createdAt) >= new Date(query.from));
  }
  if (query.to) {
    result = result.filter((entry) => new Date(entry.createdAt) <= new Date(query.to));
  }
  return paginate(result, query);
}
