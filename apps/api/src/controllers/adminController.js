import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  listFlaggedJobs,
  resolveFlaggedJob,
  listDisputes,
  resolveDispute,
  togglePlatformControl
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function getUsers(req, res) {
  const { role, status, search } = req.query;
  return ok(res, await listUsers({ role, status, search }));
}

export async function patchUserStatus(req, res) {
  const { userId } = req.params;
  const { status } = req.body;
  if (!["active", "suspended", "banned"].includes(status)) {
    return fail(res, "status must be active, suspended, or banned", 400);
  }
  return ok(res, await updateUserStatus(userId, status));
}

export async function getFlaggedJobs(req, res) {
  return ok(res, await listFlaggedJobs());
}

export async function patchFlaggedJob(req, res) {
  const { flagId } = req.params;
  const { action, reason } = req.body;
  if (!["approve", "reject", "escalate"].includes(action)) {
    return fail(res, "action must be approve, reject, or escalate", 400);
  }
  return ok(res, await resolveFlaggedJob(flagId, action, reason));
}

export async function getDisputes(req, res) {
  const { status } = req.query;
  return ok(res, await listDisputes(status));
}

export async function patchDispute(req, res) {
  const { disputeId } = req.params;
  const { ruling } = req.body;
  if (!ruling) return fail(res, "ruling is required", 400);
  return ok(res, await resolveDispute(disputeId, ruling));
}

export async function patchPlatformControl(req, res) {
  const { control } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return fail(res, "enabled must be a boolean", 400);
  }
  return ok(res, await togglePlatformControl(control, enabled));
}
