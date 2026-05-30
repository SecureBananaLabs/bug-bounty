import { ok, fail } from "../utils/response.js";
import {
  getAdminDashboard,
  suspendUser,
  reactivateUser,
  banUser,
  approveJob,
  rejectJob,
  escalateJob,
  reviewDispute,
  resolveDispute,
  toggleRegistrations,
  toggleJobPostings,
} from "../services/adminService.js";

export async function getDashboard(req, res) {
  try {
    const data = await getAdminDashboard();
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to load dashboard", 500);
  }
}

export async function suspendUserController(req, res) {
  const { userId } = req.params;
  if (!userId) return fail(res, "userId is required", 400);
  const result = await suspendUser(userId);
  return ok(res, result);
}

export async function reactivateUserController(req, res) {
  const { userId } = req.params;
  if (!userId) return fail(res, "userId is required", 400);
  const result = await reactivateUser(userId);
  return ok(res, result);
}

export async function banUserController(req, res) {
  const { userId } = req.params;
  if (!userId) return fail(res, "userId is required", 400);
  const result = await banUser(userId);
  return ok(res, result);
}

export async function approveJobController(req, res) {
  const { jobId } = req.params;
  if (!jobId) return fail(res, "jobId is required", 400);
  const result = await approveJob(jobId);
  return ok(res, result);
}

export async function rejectJobController(req, res) {
  const { jobId } = req.params;
  const { reason } = req.body || {};
  if (!jobId) return fail(res, "jobId is required", 400);
  if (!reason) return fail(res, "reason is required", 400);
  const result = await rejectJob(jobId, reason);
  return ok(res, result);
}

export async function escalateJobController(req, res) {
  const { jobId } = req.params;
  if (!jobId) return fail(res, "jobId is required", 400);
  const result = await escalateJob(jobId);
  return ok(res, result);
}

export async function reviewDisputeController(req, res) {
  const { disputeId } = req.params;
  if (!disputeId) return fail(res, "disputeId is required", 400);
  const result = await reviewDispute(disputeId);
  return ok(res, result);
}

export async function resolveDisputeController(req, res) {
  const { disputeId } = req.params;
  const { ruling } = req.body || {};
  if (!disputeId) return fail(res, "disputeId is required", 400);
  if (!["client", "freelancer", "split"].includes(ruling)) {
    return fail(res, "ruling must be 'client', 'freelancer', or 'split'", 400);
  }
  const result = await resolveDispute(disputeId, ruling);
  return ok(res, result);
}

export async function toggleRegistrationsController(req, res) {
  const { enabled } = req.body || {};
  if (typeof enabled !== "boolean") return fail(res, "enabled must be a boolean", 400);
  const result = await toggleRegistrations(enabled);
  return ok(res, result);
}

export async function toggleJobPostingsController(req, res) {
  const { enabled } = req.body || {};
  if (typeof enabled !== "boolean") return fail(res, "enabled must be a boolean", 400);
  const result = await toggleJobPostings(enabled);
  return ok(res, result);
}