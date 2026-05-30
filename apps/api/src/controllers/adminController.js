import { ok } from "../utils/response.js";
import {
  getAdminOverview,
  listAdminAuditLog,
  listAdminControls,
  listAdminDisputes,
  listAdminJobs,
  listAdminUsers,
  reviewAdminJob,
  setAdminControl,
  setAdminUserStatus
} from "../services/adminService.js";
import {
  adminControlSchema,
  adminListQuerySchema,
  adminQueueQuerySchema,
  adminReviewSchema,
  adminStatusSchema
} from "../validators/admin.js";

export async function metrics(req, res) {
  return ok(res, await getAdminOverview());
}

export async function overview(req, res) {
  return ok(res, await getAdminOverview());
}

export async function users(req, res) {
  const query = adminListQuerySchema.parse(req.query);
  return ok(res, await listAdminUsers(query));
}

export async function updateUserStatus(req, res) {
  const payload = adminStatusSchema.parse(req.body);
  return ok(res, await setAdminUserStatus(req.params.userId, payload, req.user));
}

export async function jobs(req, res) {
  const query = adminQueueQuerySchema.parse(req.query);

  return ok(res, await listAdminJobs(query));
}

export async function updateJobReview(req, res) {
  const payload = adminReviewSchema.parse(req.body);
  return ok(res, await reviewAdminJob(req.params.jobId, payload, req.user));
}

export async function disputes(req, res) {
  const query = adminQueueQuerySchema.parse(req.query);

  return ok(res, await listAdminDisputes(query));
}

export async function controls(req, res) {
  return ok(res, await listAdminControls());
}

export async function updateControl(req, res) {
  const payload = adminControlSchema.parse(req.body);
  return ok(res, await setAdminControl(req.params.controlKey, payload.enabled, req.user));
}

export async function auditLog(req, res) {
  const query = adminQueueQuerySchema.parse(req.query);
  return ok(res, await listAdminAuditLog(query));
}
