import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";
import * as userService from "../services/userService.js";

export async function metrics(req, res) {
  return ok(res, await adminService.getAdminMetrics());
}

export async function getUsers(req, res) {
  return ok(res, await userService.listUsers());
}

export async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getFlaggedJobs(req, res) {
  return ok(res, await adminService.getFlaggedJobs());
}

export async function moderateJob(req, res) {
  try {
    const { action, reason } = req.body;
    const job = await adminService.moderateJob(req.params.id, action, reason, req.user.sub);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getDisputes(req, res) {
  return ok(res, await adminService.getDisputes());
}

export async function ruleDispute(req, res) {
  try {
    const { ruling, notes } = req.body;
    const dispute = await adminService.ruleDispute(req.params.id, ruling, notes, req.user.sub);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getSettings(req, res) {
  return ok(res, await adminService.getSettings());
}

export async function updateSettings(req, res) {
  try {
    const settings = await adminService.updateSettings(req.body, req.user.sub);
    return ok(res, settings);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

export async function getAuditLogs(req, res) {
  return ok(res, await adminService.getAuditLogs());
}
