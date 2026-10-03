import { ok, fail } from "../utils/response.js";
import {
  getUsers, updateUserStatus, getUserById,
  getFlaggedJobs, moderateJob,
  getDisputes, resolveDispute,
  getAdminMetrics,
  toggleRegistrations, toggleJobPostings,
  getAuditLog,
} from "../services/adminService.js";

// --- User Management ---

export async function listUsers(req, res) {
  const { page, limit, role, status, search } = req.query;
  return ok(res, await getUsers({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    role,
    status,
    search,
  }));
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!["active", "suspended", "banned"].includes(status)) {
      return fail(res, "Invalid status", 400);
    }
    const user = await updateUserStatus(parseInt(userId), status, req.user?.id || 0);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

export async function viewUser(req, res) {
  try {
    const user = await getUserById(parseInt(req.params.userId));
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// --- Job Moderation ---

export async function listFlaggedJobs(req, res) {
  const { page, limit } = req.query;
  return ok(res, await getFlaggedJobs({ page: parseInt(page) || 1, limit: parseInt(limit) || 10 }));
}

export async function moderateFlaggedJob(req, res) {
  try {
    const { jobId } = req.params;
    const { action, reason } = req.body;
    if (!["approved", "rejected", "escalated"].includes(action)) {
      return fail(res, "Invalid action", 400);
    }
    const job = await moderateJob(parseInt(jobId), action, reason || "", req.user?.id || 0);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// --- Dispute Resolution ---

export async function listDisputes(req, res) {
  const { page, limit, status } = req.query;
  return ok(res, await getDisputes({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, status }));
}

export async function resolveDisputeAction(req, res) {
  try {
    const { disputeId } = req.params;
    const { ruling } = req.body;
    if (!["freelancer", "client", "escalate"].includes(ruling)) {
      return fail(res, "Invalid ruling", 400);
    }
    const dispute = await resolveDispute(parseInt(disputeId), ruling, req.user?.id || 0);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 404);
  }
}

// --- Metrics ---

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

// --- Platform Controls ---

export async function toggleRegistration(req, res) {
  const { enabled } = req.body;
  const config = await toggleRegistrations(!!enabled, req.user?.id || 0);
  return ok(res, config);
}

export async function togglePostings(req, res) {
  const { enabled } = req.body;
  const config = await toggleJobPostings(!!enabled, req.user?.id || 0);
  return ok(res, config);
}

// --- Audit Log ---

export async function auditLog(req, res) {
  const { page, limit, adminId, action, dateFrom, dateTo } = req.query;
  return ok(res, await getAuditLog({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    adminId: adminId ? parseInt(adminId) : undefined,
    action,
    dateFrom,
    dateTo,
  }));
}
