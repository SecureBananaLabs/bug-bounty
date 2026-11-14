import { z } from "zod";
import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getControls,
  getDispute,
  getDisputes,
  getModerationJobs,
  getUser,
  getUsers,
  recordDisputeRuling,
  recordListingDecision,
  setPlatformControl,
  setUserAccountStatus
} from "../services/adminService.js";

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10)
});

const usersQuerySchema = pageSchema.extend({
  role: z.enum(["client", "freelancer", "admin"]).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
  search: z.string().trim().optional()
});

const jobsQuerySchema = pageSchema.extend({
  status: z.enum(["flagged", "approved", "rejected", "escalated"]).optional()
});

const disputesQuerySchema = pageSchema.extend({
  status: z.enum(["open", "under_review", "resolved", "escalated"]).optional()
});

const auditQuerySchema = pageSchema.extend({
  adminId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional()
});

const userStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
  reason: z.string().trim().min(3)
});

const listingDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "escalated"]),
  reason: z.string().trim().min(3)
});

const disputeRulingSchema = z.object({
  ruling: z.enum(["client", "freelancer", "refund", "escalated"]),
  reason: z.string().trim().min(3)
});

const controlSchema = z.object({
  enabled: z.boolean(),
  confirmed: z.literal(true)
});

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(usersQuerySchema.parse(req.query)));
}

export async function userDetail(req, res) {
  return ok(res, await getUser(req.params.id));
}

export async function setUserStatus(req, res) {
  const payload = userStatusSchema.parse(req.body);
  return ok(res, await setUserAccountStatus(req.params.id, payload, req.user));
}

export async function moderationJobs(req, res) {
  return ok(res, await getModerationJobs(jobsQuerySchema.parse(req.query)));
}

export async function setListingDecision(req, res) {
  const payload = listingDecisionSchema.parse(req.body);
  return ok(res, await recordListingDecision(req.params.id, payload, req.user));
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(disputesQuerySchema.parse(req.query)));
}

export async function disputeDetail(req, res) {
  return ok(res, await getDispute(req.params.id));
}

export async function ruleDispute(req, res) {
  const payload = disputeRulingSchema.parse(req.body);
  return ok(res, await recordDisputeRuling(req.params.id, payload, req.user));
}

export async function controls(req, res) {
  return ok(res, await getControls());
}

export async function setControl(req, res) {
  const payload = controlSchema.parse(req.body);
  return ok(res, await setPlatformControl(req.params.key, payload, req.user));
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(auditQuerySchema.parse(req.query)));
}
