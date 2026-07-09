import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

export async function metrics(req, res) {
  try {
    return ok(res, await adminService.getAdminMetrics());
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getUsers(req, res) {
  try {
    return ok(res, await adminService.getUsers(req.query));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function updateUser(req, res) {
  try {
    return ok(res, await adminService.updateUserStatus(req.user.id, req.params.id, req.params.action));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getFlaggedJobs(req, res) {
  try {
    return ok(res, await adminService.getFlaggedJobs(req.query));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function moderateJob(req, res) {
  try {
    return ok(res, await adminService.moderateJob(req.user.id, req.params.id, req.params.action));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getDisputes(req, res) {
  try {
    return ok(res, await adminService.getDisputes(req.query));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function moderateDispute(req, res) {
  try {
    return ok(res, await adminService.moderateDispute(req.user.id, req.params.id, req.params.action));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getControls(req, res) {
  try {
    return ok(res, await adminService.getControls());
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function updateControls(req, res) {
  try {
    return ok(res, await adminService.updateControls(req.user.id, req.body));
  } catch (err) {
    return fail(res, err.message);
  }
}

export async function getAuditLog(req, res) {
  try {
    return ok(res, await adminService.getAuditLog(req.query));
  } catch (err) {
    return fail(res, err.message);
  }
}
