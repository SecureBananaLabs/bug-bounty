import { ok, fail } from "../utils/response.js";
import { adminService } from "../services/adminService.js";

export async function getMetrics(req, res) {
  try { ok(res, await adminService.getMetrics()); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getUsers(req, res) {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await adminService.getUsers({
      page: parseInt(page) || 1, limit: parseInt(limit) || 20,
      search: search || "", role, status,
    });
    ok(res, result);
  } catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getUserDetail(req, res) {
  try { ok(res, await adminService.getUserDetail(req.params.id)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function suspendUser(req, res) {
  try { ok(res, await adminService.suspendUser(req.params.id)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function reinstateUser(req, res) {
  try { ok(res, await adminService.reinstateUser(req.params.id)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function banUser(req, res) {
  try { ok(res, await adminService.banUser(req.params.id)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getModerationQueue(req, res) {
  try { ok(res, await adminService.getModerationQueue()); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function approveJob(req, res) {
  try { ok(res, await adminService.approveJob(req.params.flaggedId)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function rejectJob(req, res) {
  try {
    if (!req.body.reason) return fail(res, "Reason is required", 400);
    ok(res, await adminService.rejectJob(req.params.flaggedId, req.body.reason));
  } catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getDisputes(req, res) {
  try { ok(res, await adminService.getDisputes()); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getDisputeDetail(req, res) {
  try { ok(res, await adminService.getDisputeDetail(req.params.id)); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function resolveDispute(req, res) {
  try {
    if (!req.body.ruling) return fail(res, "Ruling is required (FREELANCER or CLIENT)", 400);
    ok(res, await adminService.resolveDispute(req.params.id, req.body.ruling));
  } catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function getPlatformSettings(req, res) {
  try { ok(res, await adminService.getPlatformSettings()); }
  catch (e) { fail(res, e.message, e.statusCode || 500); }
}

export async function updatePlatformSettings(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return fail(res, "Settings object required", 400);
    ok(res, await adminService.updatePlatformSettings(req.body));
  } catch (e) { fail(res, e.message, e.statusCode || 500); }
}
