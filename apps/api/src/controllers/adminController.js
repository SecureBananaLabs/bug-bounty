import { fail, ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getUserDetail,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listPlatformControls,
  listUsers,
  updateDisputeRuling,
  updateListingDecision,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function userList(req, res) {
  return ok(res, await listUsers(req.query));
}

export async function userDetail(req, res) {
  const user = await getUserDetail(req.params.userId);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  return ok(res, user);
}

export async function setUserStatus(req, res) {
  const result = await updateUserStatus(req.params.userId, req.body, req.user);
  if (!result) {
    return fail(res, "User not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result);
}

export async function listingModerationList(req, res) {
  return ok(res, await listModerationQueue(req.query));
}

export async function setListingDecision(req, res) {
  const result = await updateListingDecision(req.params.listingId, req.body, req.user);
  if (!result) {
    return fail(res, "Listing not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result);
}

export async function disputeList(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function setDisputeRuling(req, res) {
  const result = await updateDisputeRuling(req.params.disputeId, req.body, req.user);
  if (!result) {
    return fail(res, "Dispute not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result);
}

export async function controlList(req, res) {
  return ok(res, await listPlatformControls());
}

export async function setControl(req, res) {
  const result = await updatePlatformControl(req.params.controlKey, req.body, req.user);
  if (!result) {
    return fail(res, "Control not found", 404);
  }

  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, result);
}

export async function auditLog(req, res) {
  return ok(res, await listAuditLog(req.query));
}
