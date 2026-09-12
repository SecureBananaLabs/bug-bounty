import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminOverview,
  getPlatformControls,
  listAdminUsers,
  listAuditEvents,
  listDisputes,
  listModerationJobs,
  updateDispute,
  updateModerationJob,
  updatePlatformControls,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function setUserStatus(req, res) {
  const { status, reason } = req.body ?? {};
  return ok(res, await updateUserStatus(req.params.id, status, req.user, reason));
}

export async function jobs(req, res) {
  return ok(res, await listModerationJobs(req.query));
}

export async function setJobModeration(req, res) {
  const { status, reason } = req.body ?? {};
  return ok(res, await updateModerationJob(req.params.id, status, req.user, reason));
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function setDisputeStatus(req, res) {
  const { status, note } = req.body ?? {};
  return ok(res, await updateDispute(req.params.id, status, req.user, note));
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function setControls(req, res) {
  return ok(res, await updatePlatformControls(req.body ?? {}, req.user));
}

export async function audit(req, res) {
  return ok(res, await listAuditEvents(req.query));
}
