import { ok, fail } from "../utils/response.js";
import {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  listFlaggedJobs,
  moderateJob,
  listDisputes,
  ruleDispute,
  getAuditLog,
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function getUsers(req, res) {
  const { role, status, search } = req.query;
  return ok(res, await listUsers({ role, status, search }));
}

export async function patchUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return fail(res, "status is required", 400);
  try {
    const user = await updateUserStatus(id, status);
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getFlaggedJobs(req, res) {
  const { status } = req.query;
  return ok(res, await listFlaggedJobs(status));
}

export async function patchJobDecision(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  if (!decision) return fail(res, "decision is required", 400);
  try {
    const job = await moderateJob(id, decision);
    if (!job) return fail(res, "Job not found", 404);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getDisputes(req, res) {
  const { status } = req.query;
  return ok(res, await listDisputes(status));
}

export async function patchDisputeRuling(req, res) {
  const { id } = req.params;
  const { ruling } = req.body;
  if (!ruling) return fail(res, "ruling is required", 400);
  try {
    const dispute = await ruleDispute(id, ruling);
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog());
}
