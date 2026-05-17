import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

// ── Metrics ──
export async function metrics(req, res) {
  return ok(res, await adminService.getAdminMetrics());
}

// ── User Management ──
export async function getUsers(req, res) {
  try {
    const result = await adminService.getUsers(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function getUserById(req, res) {
  try {
    const user = await adminService.getUserById(req.params.id);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function suspendUser(req, res) {
  try {
    const user = await adminService.suspendUser(req.params.id, req.user?.id);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function resumeUser(req, res) {
  try {
    const user = await adminService.resumeUser(req.params.id, req.user?.id);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function banUser(req, res) {
  try {
    const user = await adminService.banUser(req.params.id, req.user?.id);
    return ok(res, user);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

// ── Job Moderation ──
export async function getFlaggedJobs(req, res) {
  try {
    const result = await adminService.getFlaggedJobs(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function approveJob(req, res) {
  try {
    const job = await adminService.approveJob(req.params.id, req.user?.id);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function rejectJob(req, res) {
  try {
    const { reason } = req.body;
    const job = await adminService.rejectJob(req.params.id, reason, req.user?.id);
    return ok(res, job);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

// ── Dispute Resolution ──
export async function getDisputes(req, res) {
  try {
    const result = await adminService.getDisputes(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function getDisputeById(req, res) {
  try {
    const dispute = await adminService.getDisputeById(req.params.id);
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function resolveDispute(req, res) {
  try {
    const dispute = await adminService.resolveDispute(
      req.params.id,
      req.body,
      req.user?.id
    );
    return ok(res, dispute);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

// ── Platform Controls ──
export async function getPlatformSettings(req, res) {
  return ok(res, await adminService.getPlatformSettings());
}

export async function toggleRegistrations(req, res) {
  try {
    const { open } = req.body;
    const settings = await adminService.toggleRegistrations(open, req.user?.id);
    return ok(res, settings);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

export async function toggleJobPosting(req, res) {
  try {
    const { open } = req.body;
    const settings = await adminService.toggleJobPosting(open, req.user?.id);
    return ok(res, settings);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}

// ── Audit Log ──
export async function getAuditLogs(req, res) {
  try {
    const result = await adminService.getAuditLogs(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
}
