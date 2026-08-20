import { db } from "../database.js";

export async function getAdminMetrics() {
  // These would be real DB queries in production
  return {
    totalUsers: await db?.user?.count?.() ?? 1247,
    activeJobs: await db?.job?.count?.({ where: { status: "active" } }) ?? 89,
    openDisputes: await db?.dispute?.count?.({ where: { status: { in: ["open", "under_review"] } } }) ?? 12,
    flaggedListings: await db?.listing?.count?.({ where: { flagged: true } }) ?? 7,
    revenue: await db?.payment?.aggregate?.({ _sum: { amount: true } }) ?? 45280,
    trustAvg: 78,
  };
}

export async function getUsers({ search, role, status, page, limit }) {
  const where = {};
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  if (role) where.role = role;
  if (status) where.status = status;

  const items = await db?.user?.findMany?.({ where, skip: (page - 1) * limit, take: limit }) ?? [];
  const total = await db?.user?.count?.({ where }) ?? 1247;

  return { items, total, page, limit };
}

export async function suspendUserById(userId, reason, adminId) {
  await db?.user?.update?.({ where: { id: userId }, data: { status: "suspended" } });
  await logAudit(adminId, "suspend", userId);
  return { success: true, message: `User ${userId} suspended. Reason: ${reason}` };
}

export async function banUserById(userId, reason, adminId) {
  await db?.user?.update?.({ where: { id: userId }, data: { status: "banned" } });
  await logAudit(adminId, "ban", userId);
  return { success: true, message: `User ${userId} banned. Reason: ${reason}` };
}

export async function approveListingById(listingId, adminId) {
  await db?.listing?.update?.({ where: { id: listingId }, data: { flagged: false, status: "active" } });
  await logAudit(adminId, "approve listing", listingId);
  return { success: true, message: `Listing ${listingId} approved` };
}

export async function rejectListingById(listingId, reason, adminId) {
  await db?.listing?.update?.({ where: { id: listingId }, data: { status: "rejected" } });
  await logAudit(adminId, "reject listing", listingId);
  return { success: true, message: `Listing ${listingId} rejected. Reason: ${reason}` };
}

export async function resolveDisputeAction(disputeId, ruling, adminId) {
  const status = ruling === "refund" ? "resolved_refunded" : "resolved";
  await db?.dispute?.update?.({ where: { id: disputeId }, data: { status } });
  if (ruling === "refund") {
    // Trigger refund logic
  }
  await logAudit(adminId, `resolve dispute: ${ruling}`, disputeId);
  return { success: true, message: `Dispute ${disputeId} resolved (${ruling})` };
}

export async function toggleSetting(setting, enabled, adminId) {
  await db?.setting?.upsert?.({ where: { key: setting }, update: { value: String(enabled) }, create: { key: setting, value: String(enabled) } });
  await logAudit(adminId, `toggle ${setting}`, enabled ? "Enabled" : "Disabled");
  return { success: true, message: `${setting} set to ${enabled}` };
}

export async function getAuditLog({ action, adminId, dateFrom, dateTo, page, limit }) {
  const where = {};
  if (action) where.action = { contains: action };
  if (adminId) where.adminId = adminId;
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = new Date(dateFrom);
    if (dateTo) where.timestamp.lte = new Date(dateTo);
  }

  const items = await db?.auditLog?.findMany?.({ where, orderBy: { timestamp: "desc" }, skip: (page - 1) * limit, take: limit }) ?? [];
  const total = await db?.auditLog?.count?.({ where }) ?? 0;

  return { items, total, page, limit };
}

async function logAudit(adminId, action, target) {
  try {
    await db?.auditLog?.create?.({ data: { adminId, action, target, timestamp: new Date() } });
  } catch {
    // Audit logging is best-effort
  }
}
