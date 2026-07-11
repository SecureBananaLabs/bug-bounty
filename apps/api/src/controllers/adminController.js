import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

export async function metrics(req, res) {
  try {
    const data = await adminService.getAdminMetrics();
    return ok(res, data);
  } catch (err) {
    console.error("Error fetching admin metrics:", err);
    return fail(res, err.message, 500);
  }
}

export async function listDisputes(req, res) {
  try {
    const data = await adminService.getDisputes();
    return ok(res, data);
  } catch (err) {
    console.error("Error listing disputes:", err);
    return fail(res, err.message, 500);
  }
}

export async function resolveDisputeAction(req, res) {
  try {
    const { disputeId, status, resolution } = req.body;
    if (!disputeId || !status) {
      return fail(res, "disputeId and status are required", 400);
    }
    if (status !== "RESOLVED" && status !== "REJECTED") {
      return fail(res, "Status must be RESOLVED or REJECTED", 400);
    }

    const adminId = req.user.sub;
    const data = await adminService.resolveDispute(disputeId, {
      status,
      resolution,
      adminId
    });
    return ok(res, data);
  } catch (err) {
    console.error("Error resolving dispute:", err);
    return fail(res, err.message, 500);
  }
}

export async function verifyUserAction(req, res) {
  try {
    const { userId, isVerified } = req.body;
    if (!userId || typeof isVerified !== "boolean") {
      return fail(res, "userId and isVerified (boolean) are required", 400);
    }

    const adminId = req.user.sub;
    const data = await adminService.verifyUser(userId, {
      isVerified,
      adminId
    });
    return ok(res, data);
  } catch (err) {
    console.error("Error verifying user:", err);
    return fail(res, err.message, 500);
  }
}

export async function listAuditLogs(req, res) {
  try {
    const data = await adminService.getAuditLogs();
    return ok(res, data);
  } catch (err) {
    console.error("Error listing audit logs:", err);
    return fail(res, err.message, 500);
  }
}
