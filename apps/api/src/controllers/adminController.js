import { ok, fail } from "../utils/response.js";
import * as adminService from "../services/adminService.js";

// ─── Dashboard Metrics ─────────────────────────────────────

export async function getMetrics(req, res) {
  try {
    return ok(res, await adminService.getAdminMetrics());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ─── User Management ───────────────────────────────────────

export async function listUsers(req, res) {
  try {
    const result = await adminService.getAdminUsers(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function suspendUser(req, res) {
  try {
    const result = adminService.suspendUser(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function reinstateUser(req, res) {
  try {
    const result = adminService.reinstateUser(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function banUser(req, res) {
  try {
    const result = adminService.banUser(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ─── Job Moderation ────────────────────────────────────────

export async function listJobs(req, res) {
  try {
    const result = await adminService.getAdminJobs(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function approveJob(req, res) {
  try {
    const result = await adminService.approveJob(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function rejectJob(req, res) {
  try {
    const { reason } = req.body || {};
    const result = await adminService.rejectJob(req.user.sub, req.params.id, reason);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function escalateJob(req, res) {
  try {
    const result = await adminService.escalateJob(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ─── Disputes ──────────────────────────────────────────────

export async function listDisputes(req, res) {
  try {
    const result = adminService.getDisputes(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function createDispute(req, res) {
  try {
    const { jobId, reason } = req.body;
    if (!jobId) return fail(res, "jobId is required");
    const result = await adminService.createDispute(req.user.sub, jobId, reason);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function resolveDispute(req, res) {
  try {
    const result = await adminService.resolveDispute(req.user.sub, req.params.id, req.body);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function escalateDispute(req, res) {
  try {
    const result = await adminService.escalateDispute(req.user.sub, req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function addDisputeNote(req, res) {
  try {
    const { note } = req.body;
    if (!note) return fail(res, "note is required");
    const result = adminService.addDisputeNote(req.user.sub, req.params.id, note);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ─── Audit Log ─────────────────────────────────────────────

export async function getAuditLog(req, res) {
  try {
    const result = adminService.getAuditLog(req.query);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ─── Platform Controls ─────────────────────────────────────

export async function getSettings(req, res) {
  try {
    return ok(res, adminService.getPlatformSettings());
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function toggleRegistrations(req, res) {
  try {
    const result = adminService.toggleRegistration(req.user.sub);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function toggleJobPosting(req, res) {
  try {
    const result = adminService.toggleJobPosting(req.user.sub);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
