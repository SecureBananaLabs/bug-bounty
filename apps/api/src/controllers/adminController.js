import { ok, fail } from "../utils/response.js";
import { getAdminMetrics, listUsers, updateUser, listJobs, updateJob, listDisputes, resolveDispute, getHealth } from "../services/adminService.js";

export async function metrics(req, res) { return ok(res, await getAdminMetrics()); }

export async function users(req, res) { return ok(res, await listUsers()); }

export async function updateUserHandler(req, res) {
  const { action } = req.body;
  const result = await updateUser(req.params.id, action);
  if (!result) return fail(res, "User not found", 404);
  return ok(res, result);
}

export async function jobs(req, res) { return ok(res, await listJobs()); }

export async function updateJobHandler(req, res) {
  const { action } = req.body;
  const result = await updateJob(req.params.id, action);
  if (!result) return fail(res, "Job not found", 404);
  return ok(res, result);
}

export async function disputes(req, res) { return ok(res, await listDisputes()); }

export async function resolveDisputeHandler(req, res) {
  const { resolution } = req.body;
  const result = await resolveDispute(req.params.id, resolution);
  if (!result) return fail(res, "Dispute not found", 404);
  return ok(res, result);
}

export async function health(req, res) { return ok(res, await getHealth()); }