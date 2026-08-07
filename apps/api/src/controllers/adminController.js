import { ok } from "../utils/response.js";
import {
  applyJobAction,
  applyUserAction,
  getAdminMetrics,
  listAdminJobs,
  listAdminUsers,
  listAuditEvents,
  listDisputes,
  listPlatformControls,
  resolveDispute,
  updatePlatformControl
} from "../services/adminService.js";
import {
  adminActionSchema,
  adminListQuerySchema,
  disputeResolutionSchema,
  platformControlSchema
} from "../validators/admin.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function overview(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  const query = adminListQuerySchema.parse(req.query);
  return ok(res, await listAdminUsers(query));
}

export async function userAction(req, res) {
  const payload = adminActionSchema.parse(req.body);
  return ok(res, await applyUserAction(req.params.id, payload, req.user.sub));
}

export async function jobs(req, res) {
  const query = adminListQuerySchema.parse(req.query);
  return ok(res, await listAdminJobs(query));
}

export async function jobAction(req, res) {
  const payload = adminActionSchema.parse(req.body);
  return ok(res, await applyJobAction(req.params.id, payload, req.user.sub));
}

export async function disputes(req, res) {
  const query = adminListQuerySchema.parse(req.query);
  return ok(res, await listDisputes(query));
}

export async function disputeResolution(req, res) {
  const payload = disputeResolutionSchema.parse(req.body);
  return ok(res, await resolveDispute(req.params.id, payload, req.user.sub));
}

export async function controls(req, res) {
  return ok(res, await listPlatformControls());
}

export async function controlUpdate(req, res) {
  const payload = platformControlSchema.parse(req.body);
  return ok(res, await updatePlatformControl(req.params.id, payload, req.user.sub));
}

export async function auditLog(req, res) {
  const query = adminListQuerySchema.parse(req.query);
  return ok(res, await listAuditEvents(query));
}
