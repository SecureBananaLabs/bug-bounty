import { ok, fail } from "../utils/response.js";
import * as admin from "../services/adminService.js";

export async function metrics(req, res) {
  try { return ok(res, await admin.getAdminMetrics()); } catch (e) { return fail(res, e.message, 500); }
}
export async function listUsers(req, res) {
  try { return ok(res, await admin.listUsers(req.query)); } catch (e) { return fail(res, e.message, 500); }
}
export async function getUserDetail(req, res) {
  try { return ok(res, await admin.getUserDetail(req.params.id)); } catch (e) { return fail(res, e.message, 404); }
}
export async function updateUserStatus(req, res) {
  try { return ok(res, await admin.updateUserStatus(req.params.id, req.body.status)); } catch (e) { return fail(res, e.message, 500); }
}
export async function listFlaggedJobs(req, res) {
  try { return ok(res, await admin.listFlaggedJobs(req.query)); } catch (e) { return fail(res, e.message, 500); }
}
export async function moderateJob(req, res) {
  try { return ok(res, await admin.moderateJob(req.params.id, req.body.action)); } catch (e) { return fail(res, e.message, 500); }
}
export async function listDisputes(req, res) {
  try { return ok(res, await admin.listDisputes(req.query)); } catch (e) { return fail(res, e.message, 500); }
}
export async function getDisputeDetail(req, res) {
  try { return ok(res, await admin.getDisputeDetail(req.params.id)); } catch (e) { return fail(res, e.message, 404); }
}
export async function resolveDispute(req, res) {
  try { return ok(res, await admin.resolveDispute(req.params.id, req.body.ruling)); } catch (e) { return fail(res, e.message, 500); }
}
export async function getControls(req, res) {
  try { return ok(res, await admin.getPlatformControls()); } catch (e) { return fail(res, e.message, 500); }
}
export async function updateControls(req, res) {
  try { return ok(res, await admin.updatePlatformControls(req.body)); } catch (e) { return fail(res, e.message, 500); }
}
