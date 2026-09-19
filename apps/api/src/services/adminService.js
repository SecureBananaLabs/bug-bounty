const seedUsers = [
  {
    id: "usr_client_101",
    name: "Avery Stone",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-01-12T10:20:00.000Z",
    trustScore: 86,
    activeJobs: ["job_marketplace_redesign"],
    disputes: ["dsp_escrow_copy"]
  },
  {
    id: "usr_freelancer_204",
    name: "Maya Patel",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-03T14:45:00.000Z",
    trustScore: 94,
    activeJobs: ["job_api_audit"],
    disputes: []
  },
  {
    id: "usr_client_188",
    name: "Noah Kim",
    email: "noah@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-21T08:10:00.000Z",
    trustScore: 41,
    activeJobs: [],
    disputes: ["dsp_mobile_refund"]
  },
  {
    id: "usr_freelancer_319",
    name: "Lena Ortiz",
    email: "lena@example.com",
    role: "freelancer",
    status: "under_review",
    joinedAt: "2026-04-09T18:30:00.000Z",
    trustScore: 58,
    activeJobs: ["job_checkout_fix"],
    disputes: ["dsp_mobile_refund"]
  }
];

const seedModerationJobs = [
  {
    id: "mod_job_901",
    title: "Crypto payout integration",
    postedBy: "usr_client_101",
    postedByName: "Avery Stone",
    status: "pending",
    reason: "Payment terms mention off-platform settlement",
    reports: 3,
    flaggedAt: "2026-06-12T12:00:00.000Z",
    notification: null
  },
  {
    id: "mod_job_902",
    title: "Scrape competitor profiles",
    postedBy: "usr_client_188",
    postedByName: "Noah Kim",
    status: "pending",
    reason: "Automated policy scanner detected prohibited scraping language",
    reports: 5,
    flaggedAt: "2026-06-13T09:15:00.000Z",
    notification: null
  }
];

const seedDisputes = [
  {
    id: "dsp_escrow_copy",
    clientId: "usr_client_101",
    freelancerId: "usr_freelancer_204",
    clientName: "Avery Stone",
    freelancerName: "Maya Patel",
    jobTitle: "Landing page copy refresh",
    status: "open",
    amountCents: 85000,
    openedAt: "2026-06-10T11:30:00.000Z",
    thread: [
      "Client says final copy missed compliance notes.",
      "Freelancer attached the approved brief and revision log."
    ],
    evidence: ["approved-brief.pdf", "revision-log.md"],
    transaction: { escrowId: "esc_2039", capturedCents: 85000, refundableCents: 85000 },
    notifications: []
  },
  {
    id: "dsp_mobile_refund",
    clientId: "usr_client_188",
    freelancerId: "usr_freelancer_319",
    clientName: "Noah Kim",
    freelancerName: "Lena Ortiz",
    jobTitle: "Mobile checkout QA",
    status: "under_review",
    amountCents: 42000,
    openedAt: "2026-06-11T16:05:00.000Z",
    thread: [
      "Client requested a refund after crash reports continued.",
      "Freelancer attached device logs showing a third-party SDK fault."
    ],
    evidence: ["device-crash.log", "sdk-vendor-ticket.txt"],
    transaction: { escrowId: "esc_2044", capturedCents: 42000, refundableCents: 30000 },
    notifications: []
  }
];

const seedControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true,
  lastChangedAt: null,
  lastChangedBy: null
};

const seedAuditLog = [
  {
    id: "aud_seed_001",
    adminId: "system",
    actionType: "system_snapshot",
    targetType: "platform",
    targetId: "admin-panel",
    message: "Admin panel seed state initialized",
    createdAt: "2026-06-12T00:00:00.000Z"
  }
];

let users;
let moderationJobs;
let disputes;
let controls;
let auditLog;

resetAdminState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function adminIdOf(admin) {
  return admin?.sub ?? admin?.id ?? "admin_unknown";
}

function appendAudit({ adminId, actionType, targetType, targetId, message }) {
  const entry = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId,
    actionType,
    targetType,
    targetId,
    message,
    createdAt: now()
  };
  auditLog.push(entry);
  return entry;
}

function paginate(items, query = {}) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10) || 10, 1), 50);
  const start = (page - 1) * pageSize;

  return {
    items: clone(items.slice(start, start + pageSize)),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
  };
}

function matchesDateRange(isoDate, from, to) {
  const time = Date.parse(isoDate);
  if (from && time < Date.parse(from)) return false;
  if (to && time > Date.parse(to)) return false;
  return true;
}

function bucketTrustScores() {
  return [
    { range: "0-49", count: users.filter((user) => user.trustScore <= 49).length },
    { range: "50-74", count: users.filter((user) => user.trustScore >= 50 && user.trustScore <= 74).length },
    { range: "75-89", count: users.filter((user) => user.trustScore >= 75 && user.trustScore <= 89).length },
    { range: "90-100", count: users.filter((user) => user.trustScore >= 90).length }
  ];
}

export function resetAdminState() {
  users = clone(seedUsers);
  moderationJobs = clone(seedModerationJobs);
  disputes = clone(seedDisputes);
  controls = clone(seedControls);
  auditLog = clone(seedAuditLog);
}

export async function getAdminMetrics() {
  const activeJobs = users.reduce((sum, user) => sum + user.activeJobs.length, 0);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationJobs.filter((job) => job.status === "pending").length;

  return {
    totalUsers: users.length,
    activeJobs,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriodCents: 12890000,
    controls: clone(controls),
    trustScoreDistribution: bucketTrustScores(),
    platformHealth: {
      api: "operational",
      payments: "operational",
      moderationQueueDepth: flaggedListings,
      disputeSlaBreaches: disputes.filter((dispute) => dispute.status === "open").length
    },
    refreshedAt: now()
  };
}

export async function listAdminUsers(query = {}) {
  const search = query.search?.toLowerCase?.().trim();
  const filtered = users.filter((user) => {
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    if (!matchesDateRange(user.joinedAt, query.joinedFrom, query.joinedTo)) return false;
    if (search) {
      const haystack = `${user.name} ${user.email} ${user.id}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return paginate(filtered, query);
}

export async function getAdminUser(userId) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;

  return clone({
    ...user,
    profile: {
      headline: user.role === "freelancer" ? "Verified freelance operator" : "Marketplace client",
      activeJobs: user.activeJobs,
      disputeHistory: user.disputes
    }
  });
}

export async function updateAdminUserStatus(userId, { action, reason }, admin) {
  const statusByAction = {
    suspend: "suspended",
    reinstate: "active",
    ban: "banned"
  };
  const nextStatus = statusByAction[action];
  if (!nextStatus) {
    return { error: "Unsupported user action", status: 400 };
  }

  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  user.status = nextStatus;
  user.statusReason = reason ?? null;
  user.updatedAt = now();

  const audit = appendAudit({
    adminId: adminIdOf(admin),
    actionType: `user_${action}`,
    targetType: "user",
    targetId: user.id,
    message: `${action} applied to ${user.email}${reason ? `: ${reason}` : ""}`
  });

  return { user: clone(user), audit: clone(audit) };
}

export async function listModerationJobs(query = {}) {
  const filtered = moderationJobs.filter((job) => {
    if (query.status && job.status !== query.status) return false;
    if (!matchesDateRange(job.flaggedAt, query.flaggedFrom, query.flaggedTo)) return false;
    return true;
  });

  return paginate(filtered, query);
}

export async function moderateJob(jobId, { action, reason }, admin) {
  const statusByAction = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  const nextStatus = statusByAction[action];
  if (!nextStatus) {
    return { error: "Unsupported moderation action", status: 400 };
  }

  const job = moderationJobs.find((candidate) => candidate.id === jobId);
  if (!job) {
    return { error: "Moderation job not found", status: 404 };
  }

  job.status = nextStatus;
  job.resolutionReason = reason ?? null;
  job.reviewedAt = now();
  job.reviewedBy = adminIdOf(admin);
  if (action === "reject") {
    job.notification = {
      toUserId: job.postedBy,
      message: `Your listing "${job.title}" was rejected${reason ? `: ${reason}` : "."}`,
      createdAt: now()
    };
  }

  const audit = appendAudit({
    adminId: adminIdOf(admin),
    actionType: `job_${action}`,
    targetType: "job",
    targetId: job.id,
    message: `${action} applied to ${job.title}${reason ? `: ${reason}` : ""}`
  });

  return { job: clone(job), audit: clone(audit), notification: clone(job.notification) };
}

export async function listDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => {
    if (query.status && dispute.status !== query.status) return false;
    if (!matchesDateRange(dispute.openedAt, query.openedFrom, query.openedTo)) return false;
    return true;
  });

  return paginate(filtered, query);
}

export async function getDispute(disputeId) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  return dispute ? clone(dispute) : null;
}

export async function ruleOnDispute(disputeId, { action, note }, admin) {
  const dispute = disputes.find((candidate) => candidate.id === disputeId);
  if (!dispute) {
    return { error: "Dispute not found", status: 404 };
  }

  const resolutionByAction = {
    favor_client: "resolved",
    favor_freelancer: "resolved",
    refund: "resolved",
    escalate: "under_review"
  };
  const nextStatus = resolutionByAction[action];
  if (!nextStatus) {
    return { error: "Unsupported dispute action", status: 400 };
  }

  dispute.status = nextStatus;
  dispute.ruling = action;
  dispute.rulingNote = note ?? null;
  dispute.ruledAt = now();
  dispute.ruledBy = adminIdOf(admin);
  dispute.notifications.push(
    { toUserId: dispute.clientId, message: `Dispute ${dispute.id} updated: ${action}`, createdAt: now() },
    { toUserId: dispute.freelancerId, message: `Dispute ${dispute.id} updated: ${action}`, createdAt: now() }
  );

  const audit = appendAudit({
    adminId: adminIdOf(admin),
    actionType: `dispute_${action}`,
    targetType: "dispute",
    targetId: dispute.id,
    message: `Ruling ${action} recorded for ${dispute.jobTitle}${note ? `: ${note}` : ""}`
  });

  return { dispute: clone(dispute), audit: clone(audit) };
}

export async function getPlatformControls() {
  return clone(controls);
}

export async function updatePlatformControls(payload, admin) {
  if (payload.confirmed !== true) {
    return { error: "Control changes require confirmation", status: 409 };
  }

  const changes = {};
  for (const key of ["registrationsEnabled", "jobPostingsEnabled"]) {
    if (typeof payload[key] === "boolean" && controls[key] !== payload[key]) {
      changes[key] = { from: controls[key], to: payload[key] };
      controls[key] = payload[key];
    }
  }

  controls.lastChangedAt = now();
  controls.lastChangedBy = adminIdOf(admin);

  const audit = appendAudit({
    adminId: adminIdOf(admin),
    actionType: "platform_controls_update",
    targetType: "platform",
    targetId: "controls",
    message: `Platform controls updated: ${Object.keys(changes).join(", ") || "no-op"}`
  });

  return { controls: clone(controls), changes, audit: clone(audit) };
}

export async function listAuditLog(query = {}) {
  const filtered = auditLog.filter((entry) => {
    if (query.adminId && entry.adminId !== query.adminId) return false;
    if (query.actionType && entry.actionType !== query.actionType) return false;
    if (!matchesDateRange(entry.createdAt, query.from, query.to)) return false;
    return true;
  });

  return paginate([...filtered].reverse(), query);
}
