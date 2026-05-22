const initialData = {
  users: [
    {
      id: "usr_001",
      name: "Maya Chen",
      email: "maya@example.com",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-04-02T09:00:00.000Z",
      trustScore: 94,
      activeJobs: ["job_101", "job_103"],
      disputes: ["dsp_001"]
    },
    {
      id: "usr_002",
      name: "Jordan Blake",
      email: "jordan@example.com",
      role: "client",
      status: "active",
      joinedAt: "2026-04-11T13:30:00.000Z",
      trustScore: 82,
      activeJobs: ["job_102"],
      disputes: []
    },
    {
      id: "usr_003",
      name: "Sam Rivera",
      email: "sam@example.com",
      role: "freelancer",
      status: "suspended",
      joinedAt: "2026-05-03T16:15:00.000Z",
      trustScore: 51,
      activeJobs: [],
      disputes: ["dsp_002"]
    },
    {
      id: "usr_004",
      name: "Priya Shah",
      email: "priya@example.com",
      role: "client",
      status: "active",
      joinedAt: "2026-05-12T10:45:00.000Z",
      trustScore: 73,
      activeJobs: ["job_104"],
      disputes: []
    }
  ],
  flaggedListings: [
    {
      id: "flag_001",
      jobId: "job_104",
      title: "Scrape private marketplace leads",
      posterId: "usr_004",
      reason: "User report: unclear consent and prohibited data source",
      severity: "high",
      status: "flagged",
      createdAt: "2026-05-18T15:20:00.000Z"
    },
    {
      id: "flag_002",
      jobId: "job_105",
      title: "Fix checkout webhook retries",
      posterId: "usr_002",
      reason: "Automated rule: payment keywords require moderation",
      severity: "medium",
      status: "under_review",
      createdAt: "2026-05-19T08:10:00.000Z"
    }
  ],
  disputes: [
    {
      id: "dsp_001",
      jobId: "job_101",
      clientId: "usr_002",
      freelancerId: "usr_001",
      status: "open",
      amountCents: 150000,
      thread: [
        { from: "usr_002", message: "The delivered widget fails on Safari.", createdAt: "2026-05-17T11:10:00.000Z" },
        { from: "usr_001", message: "I uploaded a patched build and test notes.", createdAt: "2026-05-17T12:05:00.000Z" }
      ],
      evidence: [
        { type: "screenshot", label: "Safari console error", url: "https://example.com/evidence/safari-error" },
        { type: "commit", label: "Patch commit", url: "https://example.com/evidence/commit" }
      ],
      transactions: [{ id: "txn_101", status: "held", amountCents: 150000 }]
    },
    {
      id: "dsp_002",
      jobId: "job_106",
      clientId: "usr_004",
      freelancerId: "usr_003",
      status: "under_review",
      amountCents: 90000,
      thread: [{ from: "usr_004", message: "Scope was not delivered after deadline.", createdAt: "2026-05-16T18:40:00.000Z" }],
      evidence: [{ type: "file", label: "Signed scope", url: "https://example.com/evidence/scope" }],
      transactions: [{ id: "txn_106", status: "held", amountCents: 90000 }]
    }
  ],
  notifications: [],
  controls: {
    registrationsEnabled: true,
    jobPostingEnabled: true,
    updatedAt: "2026-05-17T00:00:00.000Z",
    updatedBy: "system"
  },
  revenueCurrentPeriodCents: 12890000,
  auditLog: [
    {
      id: "aud_001",
      adminId: "system",
      actionType: "seed",
      targetType: "system",
      targetId: "initial",
      summary: "Initial admin dataset loaded",
      createdAt: "2026-05-17T00:00:00.000Z"
    }
  ]
};

let data = clone(initialData);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function adminId(admin) {
  return admin?.sub || admin?.id || admin?.email || "unknown_admin";
}

function parsePage(query = {}) {
  const page = Math.max(Number.parseInt(query.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize || "10", 10), 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = parsePage(query);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages
  };
}

function appendAudit(admin, actionType, targetType, targetId, summary, metadata = {}) {
  const entry = {
    id: `aud_${String(data.auditLog.length + 1).padStart(3, "0")}`,
    adminId: adminId(admin),
    actionType,
    targetType,
    targetId,
    summary,
    metadata,
    createdAt: new Date().toISOString()
  };
  data.auditLog.push(entry);
  return entry;
}

function notify(userId, type, message, metadata = {}) {
  const notification = {
    id: `ntf_${String(data.notifications.length + 1).padStart(3, "0")}`,
    userId,
    type,
    message,
    metadata,
    createdAt: new Date().toISOString()
  };
  data.notifications.push(notification);
  return notification;
}

function trustDistribution() {
  return [
    { range: "90-100", count: data.users.filter((user) => user.trustScore >= 90).length },
    { range: "70-89", count: data.users.filter((user) => user.trustScore >= 70 && user.trustScore < 90).length },
    { range: "50-69", count: data.users.filter((user) => user.trustScore >= 50 && user.trustScore < 70).length },
    { range: "0-49", count: data.users.filter((user) => user.trustScore < 50).length }
  ];
}

export function resetAdminData() {
  data = clone(initialData);
}

export async function getAdminMetrics() {
  return {
    totalUsers: data.users.length,
    activeJobs: new Set(data.users.flatMap((user) => user.activeJobs)).size,
    openDisputes: data.disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: data.flaggedListings.filter((listing) => listing.status !== "approved").length,
    revenueCurrentPeriodCents: data.revenueCurrentPeriodCents,
    trustDistribution: trustDistribution()
  };
}

export async function listUsers(query = {}) {
  const search = query.search?.toLowerCase();
  const filtered = data.users.filter((user) => {
    if (search && !`${user.name} ${user.email}`.toLowerCase().includes(search)) return false;
    if (query.role && user.role !== query.role) return false;
    if (query.status && user.status !== query.status) return false;
    if (query.joinedAfter && new Date(user.joinedAt) < new Date(query.joinedAfter)) return false;
    if (query.joinedBefore && new Date(user.joinedAt) > new Date(query.joinedBefore)) return false;
    return true;
  });
  return paginate(filtered, query);
}

export async function setUserStatus(id, payload = {}, admin) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(payload.status)) {
    return { error: "status must be one of active, suspended, or banned" };
  }

  const user = data.users.find((item) => item.id === id);
  if (!user) return null;

  const previousStatus = user.status;
  user.status = payload.status;
  user.statusReason = payload.reason || null;
  user.updatedAt = new Date().toISOString();

  const audit = appendAudit(
    admin,
    `user.${payload.status}`,
    "user",
    user.id,
    `Changed ${user.name} from ${previousStatus} to ${payload.status}`,
    { previousStatus, reason: payload.reason || null }
  );

  return { user, audit };
}

export async function listFlaggedListings(query = {}) {
  const filtered = data.flaggedListings.filter((listing) => {
    if (query.status && listing.status !== query.status) return false;
    if (query.severity && listing.severity !== query.severity) return false;
    return true;
  });
  return paginate(filtered, query);
}

export async function decideFlaggedListing(id, payload = {}, admin) {
  const allowed = new Set(["approve", "reject", "escalate"]);
  if (!allowed.has(payload.decision)) {
    return { error: "decision must be approve, reject, or escalate" };
  }

  const listing = data.flaggedListings.find((item) => item.id === id);
  if (!listing) return null;

  const statusByDecision = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };
  listing.status = statusByDecision[payload.decision];
  listing.decisionReason = payload.reason || null;
  listing.reviewedAt = new Date().toISOString();
  listing.reviewedBy = adminId(admin);

  const notification =
    payload.decision === "reject"
      ? notify(
          listing.posterId,
          "listing_rejected",
          `Your listing "${listing.title}" was rejected: ${payload.reason || "No reason provided."}`,
          { listingId: listing.id, jobId: listing.jobId }
        )
      : null;

  const audit = appendAudit(
    admin,
    `listing.${listing.status}`,
    "listing",
    listing.id,
    `Marked flagged listing ${listing.jobId} as ${listing.status}`,
    { reason: payload.reason || null }
  );

  return { listing, notification, audit };
}

export async function listDisputes(query = {}) {
  const filtered = data.disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function getDispute(id) {
  return data.disputes.find((dispute) => dispute.id === id) || null;
}

export async function ruleOnDispute(id, payload = {}, admin) {
  const allowed = new Set(["freelancer", "client", "refund", "escalate"]);
  if (!allowed.has(payload.ruling)) {
    return { error: "ruling must be freelancer, client, refund, or escalate" };
  }

  const dispute = data.disputes.find((item) => item.id === id);
  if (!dispute) return null;

  dispute.status = payload.ruling === "escalate" ? "under_review" : "resolved";
  dispute.ruling = payload.ruling;
  dispute.rulingNote = payload.note || null;
  dispute.resolvedAt = payload.ruling === "escalate" ? null : new Date().toISOString();
  dispute.reviewedBy = adminId(admin);

  const notifications = [
    notify(dispute.clientId, "dispute_ruling", `Dispute ${dispute.id} was updated by an admin.`, {
      disputeId: dispute.id,
      ruling: payload.ruling
    }),
    notify(dispute.freelancerId, "dispute_ruling", `Dispute ${dispute.id} was updated by an admin.`, {
      disputeId: dispute.id,
      ruling: payload.ruling
    })
  ];

  const audit = appendAudit(
    admin,
    payload.ruling === "escalate" ? "dispute.escalated" : "dispute.resolved",
    "dispute",
    dispute.id,
    `Recorded ${payload.ruling} ruling for dispute ${dispute.id}`,
    { note: payload.note || null }
  );

  return { dispute, notifications, audit };
}

export async function getPlatformControls() {
  return data.controls;
}

export async function setPlatformControls(payload = {}, admin) {
  if (payload.confirmed !== true) {
    return { error: "confirmed must be true before changing platform controls" };
  }

  const updates = {};
  for (const key of ["registrationsEnabled", "jobPostingEnabled"]) {
    if (typeof payload[key] === "boolean") updates[key] = payload[key];
  }

  if (Object.keys(updates).length === 0) {
    return { error: "at least one platform control must be provided" };
  }

  const previous = { ...data.controls };
  data.controls = {
    ...data.controls,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminId(admin)
  };

  const audit = appendAudit(admin, "platform.controls.updated", "platform", "controls", "Updated platform controls", {
    previous,
    updates
  });

  return { controls: data.controls, audit };
}

export async function listAuditLog(query = {}) {
  const filtered = data.auditLog.filter((entry) => {
    if (query.adminId && entry.adminId !== query.adminId) return false;
    if (query.actionType && entry.actionType !== query.actionType) return false;
    if (query.from && new Date(entry.createdAt) < new Date(query.from)) return false;
    if (query.to && new Date(entry.createdAt) > new Date(query.to)) return false;
    return true;
  });
  return paginate([...filtered].reverse(), query);
}
