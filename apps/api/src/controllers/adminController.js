import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

// Metrics
export async function metrics(req, res) {
  try {
    const data = await adminService.getAdminMetrics();
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to fetch metrics", 500);
  }
}

// Users
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await adminService.getAllUsers(Number(page), Number(limit));
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to fetch users", 500);
  }
}

export async function getUserById(req, res) {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return fail(res, "User not found", 404);
    return ok(res, user);
  } catch (err) {
    return fail(res, "Failed to fetch user", 500);
  }
}

export async function suspendUser(req, res) {
  try {
    await adminService.suspendUser(req.params.id);
    await adminService.createAuditLog({
      userId: req.user.id,
      action: "SUSPEND_USER",
      entityType: "User",
      entityId: req.params.id,
    });
    return ok(res, { message: "User suspended" });
  } catch (err) {
    return fail(res, "Failed to suspend user", 500);
  }
}

export async function activateUser(req, res) {
  try {
    await adminService.activateUser(req.params.id);
    await adminService.createAuditLog({
      userId: req.user.id,
      action: "ACTIVATE_USER",
      entityType: "User",
      entityId: req.params.id,
    });
    return ok(res, { message: "User activated" });
  } catch (err) {
    return fail(res, "Failed to activate user", 500);
  }
}

// Jobs
export async function getAllJobs(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await adminService.getAllJobs(Number(page), Number(limit));
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to fetch jobs", 500);
  }
}

export async function flagJob(req, res) {
  try {
    await adminService.flagJob(req.params.id);
    await adminService.createAuditLog({
      userId: req.user.id,
      action: "FLAG_JOB",
      entityType: "Job",
      entityId: req.params.id,
    });
    return ok(res, { message: "Job flagged" });
  } catch (err) {
    return fail(res, "Failed to flag job", 500);
  }
}

// Audit Logs
export async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const data = await adminService.getAuditLogs(Number(page), Number(limit));
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to fetch audit logs", 500);
  }
}

// Disputes
export async function createDispute(req, res) {
  try {
    const { jobId, reason } = req.body;
    const dispute = await adminService.createDispute({ jobId, raisedById: req.user.id, reason });
    await adminService.createAuditLog({
      userId: req.user.id,
      action: "CREATE_DISPUTE",
      entityType: "Dispute",
      entityId: dispute.id,
    });
    return ok(res, dispute, 201);
  } catch (err) {
    return fail(res, "Failed to create dispute", 500);
  }
}

export async function getDisputes(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const data = await adminService.getDisputes(Number(page), Number(limit), status);
    return ok(res, data);
  } catch (err) {
    return fail(res, "Failed to fetch disputes", 500);
  }
}

export async function resolveDispute(req, res) {
  try {
    const { resolution } = req.body;
    const dispute = await adminService.resolveDispute(req.params.id, {
      resolution,
      adminId: req.user.id,
    });
    await adminService.createAuditLog({
      userId: req.user.id,
      action: "RESOLVE_DISPUTE",
      entityType: "Dispute",
      entityId: req.params.id,
      metadata: { resolution },
    });
    return ok(res, dispute);
  } catch (err) {
    return fail(res, "Failed to resolve dispute", 500);
  }
}

export async function getDisputeById(req, res) {
  try {
    const dispute = await adminService.getDisputeById(req.params.id);
    if (!dispute) return fail(res, "Dispute not found", 404);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, "Failed to fetch dispute", 500);
  }
}
