const users = [
  {
    id: "usr_client_001",
    name: "Avery Chen",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-02",
    activeJobs: 3,
    disputes: 0,
    trustScore: 92
  },
  {
    id: "usr_freelancer_002",
    name: "Maya Patel",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-06",
    activeJobs: 2,
    disputes: 1,
    trustScore: 88
  },
  {
    id: "usr_client_003",
    name: "Jon Bell",
    email: "jon@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18",
    activeJobs: 1,
    disputes: 2,
    trustScore: 61
  }
];

const moderationQueue = [
  {
    id: "job_flag_101",
    jobId: "job-101",
    title: "Build an AI customer support widget",
    reporter: "automated-rules",
    reason: "Budget changed twice after proposals opened",
    status: "flagged",
    ownerId: "usr_client_001",
    createdAt: "2026-05-27"
  },
  {
    id: "job_flag_102",
    jobId: "job-104",
    title: "Scrape protected profiles at scale",
    reporter: "user-report",
    reason: "Potential platform policy violation",
    status: "under_review",
    ownerId: "usr_client_003",
    createdAt: "2026-05-28"
  }
];

const disputes = [
  {
    id: "dsp_201",
    jobId: "job-102",
    clientId: "usr_client_001",
    freelancerId: "usr_freelancer_002",
    status: "open",
    amount: 840,
    evidenceCount: 4,
    threadPreview: "Milestone accepted but final invoice is disputed.",
    openedAt: "2026-05-25"
  },
  {
    id: "dsp_202",
    jobId: "job-103",
    clientId: "usr_client_003",
    freelancerId: "usr_freelancer_002",
    status: "under_review",
    amount: 320,
    evidenceCount: 2,
    threadPreview: "Scope changed after delivery and both parties uploaded notes.",
    openedAt: "2026-05-26"
  }
];

const controls = {
  registrations: { enabled: true, label: "New user registrations" },
  jobPostings: { enabled: true, label: "New job postings" }
};

const auditLog = [
  {
    id: "aud_001",
    adminId: "system",
    action: "seed",
    targetType: "admin-panel",
    targetId: "initial-state",
    note: "Initial admin data loaded",
    createdAt: "2026-05-29T00:00:00.000Z"
  }
];

function copy(record) {
  return { ...record };
}

function pageFrom(query) {
  const page = Number.parseInt(query.page ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function pageSizeFrom(query) {
  const size = Number.parseInt(query.pageSize ?? "10", 10);
  return Number.isFinite(size) && size > 0 ? Math.min(size, 50) : 10;
}

function paginate(items, query = {}) {
  const page = pageFrom(query);
  const pageSize = pageSizeFrom(query);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize).map(copy),
    page,
    pageSize,
    total: items.length
  };
}

function audit(admin, action, targetType, targetId, note) {
  const event = {
    id: `aud_${Date.now()}_${auditLog.length + 1}`,
    adminId: admin?.sub ?? "unknown-admin",
    action,
    targetType,
    targetId,
    note,
    createdAt: new Date().toISOString()
  };
  auditLog.unshift(event);
  return copy(event);
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireValue(value, allowed, name) {
  if (!allowed.includes(value)) {
    throw httpError(`Invalid ${name}`, 400);
  }
}

export async function getAdminMetrics() {
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = moderationQueue.filter((listing) => listing.status !== "approved").length;
  const trustBands = users.reduce(
    (bands, user) => {
      if (user.trustScore >= 85) bands.high += 1;
      else if (user.trustScore >= 70) bands.medium += 1;
      else bands.low += 1;
      return bands;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return {
    totalUsers: users.length,
    activeJobs: 42,
    openDisputes,
    flaggedListings,
    revenueCurrentPeriod: 128900,
    trustBands,
    controls: Object.fromEntries(
      Object.entries(controls).map(([key, value]) => [key, { ...value }])
    )
  };
}

export async function listUsers(query = {}) {
  let rows = [...users];
  if (query.role) rows = rows.filter((user) => user.role === query.role);
  if (query.status) rows = rows.filter((user) => user.status === query.status);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    rows = rows.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
    );
  }
  return paginate(rows, query);
}

export async function setUserStatus(id, payload, admin) {
  requireValue(payload.status, ["active", "suspended", "banned"], "status");
  const user = users.find((item) => item.id === id);
  if (!user) throw httpError("User not found", 404);
  user.status = payload.status;
  const event = audit(admin, `user.${payload.status}`, "user", id, payload.reason ?? "No reason provided");
  return { user: copy(user), audit: event };
}

export async function listModerationQueue(query = {}) {
  let rows = [...moderationQueue];
  if (query.status) rows = rows.filter((item) => item.status === query.status);
  return paginate(rows, query);
}

export async function updateListingStatus(id, payload, admin) {
  requireValue(payload.status, ["approved", "rejected", "escalated", "under_review"], "status");
  const listing = moderationQueue.find((item) => item.id === id);
  if (!listing) throw httpError("Listing not found", 404);
  listing.status = payload.status;
  listing.resolutionReason = payload.reason ?? "";
  listing.lastNotification = `Listing ${payload.status}: ${listing.resolutionReason || "status updated"}`;
  const event = audit(admin, `listing.${payload.status}`, "listing", id, listing.lastNotification);
  return { listing: copy(listing), audit: event };
}

export async function listDisputes(query = {}) {
  let rows = [...disputes];
  if (query.status) rows = rows.filter((item) => item.status === query.status);
  return paginate(rows, query);
}

export async function updateDisputeStatus(id, payload, admin) {
  requireValue(payload.status, ["open", "under_review", "resolved", "escalated"], "status");
  const dispute = disputes.find((item) => item.id === id);
  if (!dispute) throw httpError("Dispute not found", 404);
  dispute.status = payload.status;
  dispute.ruling = payload.ruling ?? dispute.ruling ?? "";
  dispute.lastNotification = `Dispute ${payload.status}: ${dispute.ruling || "status updated"}`;
  const event = audit(admin, `dispute.${payload.status}`, "dispute", id, dispute.lastNotification);
  return { dispute: copy(dispute), audit: event };
}

export async function listPlatformControls() {
  return Object.entries(controls).map(([key, value]) => ({ key, ...value }));
}

export async function setPlatformControl(key, payload, admin) {
  if (!Object.hasOwn(controls, key)) throw httpError("Control not found", 404);
  if (typeof payload.enabled !== "boolean") throw httpError("Invalid enabled value", 400);
  controls[key].enabled = payload.enabled;
  const event = audit(
    admin,
    `control.${payload.enabled ? "enabled" : "disabled"}`,
    "platform-control",
    key,
    payload.reason ?? "No reason provided"
  );
  return { control: { key, ...controls[key] }, audit: event };
}

export async function listAuditEvents(query = {}) {
  let rows = [...auditLog];
  if (query.action) rows = rows.filter((item) => item.action.includes(query.action));
  if (query.adminId) rows = rows.filter((item) => item.adminId === query.adminId);
  return paginate(rows, query);
}
