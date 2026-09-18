const users = [
  { id: "usr_1001", name: "Maya Chen", email: "maya@example.com", role: "freelancer", status: "active", joinedAt: "2026-06-12", activeJobs: 3, disputes: 1 },
  { id: "usr_1002", name: "Oliver Grant", email: "oliver@example.com", role: "client", status: "active", joinedAt: "2026-06-09", activeJobs: 2, disputes: 2 },
  { id: "usr_1003", name: "Priya Shah", email: "priya@example.com", role: "freelancer", status: "suspended", joinedAt: "2026-05-28", activeJobs: 0, disputes: 1 }
];
const listings = [
  { id: "job_2001", title: "Build a fintech landing page", owner: "Maya Chen", reason: "Duplicate content", priority: "high", status: "flagged" },
  { id: "job_2002", title: "Illustration pack — 40 scenes", owner: "Sofia Rossi", reason: "User report", priority: "medium", status: "flagged" }
];
const disputes = [{ id: "DSP-1048", subject: "Website redesign milestone", parties: "Maya Chen · Oliver Grant", status: "open", amount: 1250 }];
const audit = [];
const controls = { registrations: true, jobs: true };
const page = (items, pageNumber = 1, pageSize = 20) => ({ items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), page: pageNumber, pageSize, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) });
const record = (adminId, action, target, reason = "") => audit.unshift({ id: `evt_${Date.now()}`, adminId, action, target, reason, timestamp: new Date().toISOString() });

export function getAdminMetrics() {
  return { totalUsers: 12840, activeJobs: 3426, openDisputes: 28, flaggedListings: 17, revenue: 184290, trustScores: [{ bucket: "90–100", value: 68 }, { bucket: "75–89", value: 82 }, { bucket: "60–74", value: 55 }, { bucket: "40–59", value: 24 }, { bucket: "0–39", value: 8 }] };
}
export function getUser(userId) { return users.find((u) => u.id === userId) || null; }
export function getDispute(disputeId) { return disputes.find((d) => d.id === disputeId) || null; }
export function getAdminUsers({ pageNumber = 1, pageSize = 20, search = "", role = "", status = "", joinedAfter = "" } = {}) {
  const q = search.toLowerCase();
  return page(users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (!role || u.role === role) && (!status || u.status === status) && (!joinedAfter || u.joinedAt >= joinedAfter)), pageNumber, pageSize);
}
export function getModeration({ pageNumber = 1, pageSize = 20 } = {}) { return page(listings, pageNumber, pageSize); }
export function getDisputes({ pageNumber = 1, pageSize = 20 } = {}) { return page(disputes, pageNumber, pageSize); }
export function getAudit({ pageNumber = 1, pageSize = 20, adminId = "", action = "", from = "", to = "" } = {}) {
  return page(audit.filter((e) => (!adminId || e.adminId === adminId) && (!action || e.action === action) && (!from || e.timestamp >= from) && (!to || e.timestamp <= `${to}T23:59:59.999Z`)), pageNumber, pageSize);
}
export function getControls() { return { ...controls }; }
export function changeUser(userId, nextStatus, adminId, reason) { const user = users.find((u) => u.id === userId); if (!user) return null; user.status = nextStatus; record(adminId, `user_${nextStatus}`, userId, reason); return user; }
export function moderateListing(listingId, decision, adminId, reason) { const item = listings.find((l) => l.id === listingId); if (!item) return null; item.status = decision; record(adminId, `listing_${decision}`, listingId, reason); return item; }
export function resolveDispute(disputeId, decision, adminId, reason) { const item = disputes.find((d) => d.id === disputeId); if (!item) return null; item.status = decision; record(adminId, `dispute_${decision}`, disputeId, reason); return item; }
export function updateControl(name, enabled, adminId) { if (!(name in controls)) return null; controls[name] = Boolean(enabled); record(adminId, `control_${controls[name] ? "enabled" : "disabled"}`, name); return { name, enabled: controls[name] }; }
