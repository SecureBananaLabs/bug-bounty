import {
  adminUsers,
  auditLogs,
  disputes,
  flaggedListings,
  platformControls
} from "./adminData.js";

function paginate(items, { page, pageSize }) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize))
  };
}

function betweenDates(value, from, to) {
  const timestamp = new Date(value).getTime();
  if (from && timestamp < new Date(from).getTime()) return false;
  if (to && timestamp > new Date(to).getTime()) return false;
  return true;
}

function addAuditLog({ adminId, actionType, targetType, targetId, detail }) {
  const entry = {
    id: `audit_${String(auditLogs.length + 1).padStart(3, "0")}`,
    adminId,
    actionType,
    targetType,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };
  auditLogs.unshift(entry);
  return entry;
}

function trustDistribution() {
  return [
    { label: "0-49", count: adminUsers.filter((user) => user.trustScore < 50).length },
    {
      label: "50-79",
      count: adminUsers.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length
    },
    { label: "80-100", count: adminUsers.filter((user) => user.trustScore >= 80).length }
  ];
}

export async function getAdminOverview() {
  return {
    metrics: {
      totalUsers: adminUsers.length,
      activeJobs: adminUsers.reduce((sum, user) => sum + user.activeJobs, 0),
      openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
      flaggedListings: flaggedListings.filter((listing) => listing.status === "flagged").length,
      revenueCurrentPeriod: 128900
    },
    trustDistribution: trustDistribution(),
    platformControls
  };
}

export async function getAdminMetrics() {
  const overview = await getAdminOverview();
  return {
    ...overview.metrics,
    openJobs: overview.metrics.activeJobs,
    activeFreelancers: adminUsers.filter((user) => user.role === "freelancer" && user.status === "active").length,
    flaggedAccounts: adminUsers.filter((user) => user.status !== "active").length,
    monthlyVolume: overview.metrics.revenueCurrentPeriod
  };
}

export async function listAdminUsers(query) {
  const search = query.search?.toLowerCase();
  const filtered = adminUsers.filter((user) => {
    const matchesSearch =
      !search ||
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);
    const matchesRole = !query.role || user.role === query.role;
    const matchesStatus = !query.status || user.status === query.status;
    const matchesDate = betweenDates(user.joinedAt, query.joinedFrom, query.joinedTo);

    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  return paginate(filtered, query);
}

export async function getAdminUserProfile(userId) {
  const user = adminUsers.find((item) => item.id === userId);
  if (!user) return null;

  return {
    ...user,
    activeJobs: flaggedListings
      .filter((listing) => listing.ownerId === user.id)
      .map((listing) => ({ id: listing.jobId, title: listing.title, status: listing.status })),
    disputeHistory: disputes.filter(
      (dispute) => dispute.clientId === user.id || dispute.freelancerId === user.id
    )
  };
}

export async function updateAdminUserStatus(userId, payload, adminId) {
  const user = adminUsers.find((item) => item.id === userId);
  if (!user) return null;

  const nextStatusByAction = {
    suspend: "suspended",
    reinstate: "active",
    ban: "banned"
  };

  user.status = nextStatusByAction[payload.action];
  const audit = addAuditLog({
    adminId,
    actionType: `user.${payload.action}`,
    targetType: "user",
    targetId: user.id,
    detail: payload.reason ?? `User ${payload.action} action applied`
  });

  return { user, audit };
}

export async function listFlaggedListings(query) {
  const filtered = flaggedListings.filter((listing) => !query.status || listing.status === query.status);
  return paginate(filtered, query);
}

export async function applyModerationDecision(listingId, payload, adminId) {
  const listing = flaggedListings.find((item) => item.id === listingId);
  if (!listing) return null;

  const nextStatusByDecision = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated"
  };

  listing.status = nextStatusByDecision[payload.decision];
  const audit = addAuditLog({
    adminId,
    actionType: `listing.${payload.decision}`,
    targetType: "job",
    targetId: listing.jobId,
    detail: payload.reason
  });

  return {
    listing,
    audit,
    notification: {
      toUserId: listing.ownerId,
      title: `Listing ${listing.status}`,
      body: payload.reason
    }
  };
}

export async function listDisputes(query) {
  const filtered = disputes.filter((dispute) => !query.status || dispute.status === query.status);
  return paginate(filtered, query);
}

export async function applyDisputeRuling(disputeId, payload, adminId) {
  const dispute = disputes.find((item) => item.id === disputeId);
  if (!dispute) return null;

  dispute.status = payload.ruling === "escalate" ? "escalated" : "resolved";
  const audit = addAuditLog({
    adminId,
    actionType: `dispute.${payload.ruling}`,
    targetType: "dispute",
    targetId: dispute.id,
    detail: payload.note
  });

  return {
    dispute,
    audit,
    refundTriggered: payload.ruling === "favor_client" || payload.ruling === "refund",
    notifications: [
      { toUserId: dispute.clientId, title: "Dispute ruling updated", body: payload.note },
      { toUserId: dispute.freelancerId, title: "Dispute ruling updated", body: payload.note }
    ]
  };
}

export async function getPlatformControls() {
  return platformControls;
}

export async function updatePlatformControl(control, payload, adminId) {
  if (!(control in platformControls)) return null;

  platformControls[control] = payload.enabled;
  const audit = addAuditLog({
    adminId,
    actionType: `platform.${control}`,
    targetType: "platform-control",
    targetId: control,
    detail: `${control} set to ${payload.enabled ? "enabled" : "disabled"}`
  });

  return { controls: platformControls, audit };
}

export async function listAuditLogs(query) {
  const filtered = auditLogs.filter((entry) => {
    const matchesAdmin = !query.adminId || entry.adminId === query.adminId;
    const matchesAction = !query.actionType || entry.actionType === query.actionType;
    const matchesDate = betweenDates(entry.createdAt, query.from, query.to);

    return matchesAdmin && matchesAction && matchesDate;
  });

  return paginate(filtered, query);
}
