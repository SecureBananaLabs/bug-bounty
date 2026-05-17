import { fail, ok } from "../utils/response.js";
import {
  getAdminDashboard,
  getAdminMetrics,
  getPlatformControls,
  listAdminNotifications,
  listAdminUsers,
  listDisputes,
  listFlaggedJobs,
  moderateFlaggedJob,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function dashboard(req, res) {
  return ok(res, await getAdminDashboard());
}

export async function users(req, res) {
  return ok(res, await listAdminUsers(req.query));
}

export async function moderateUser(req, res) {
  let user;
  try {
    user = await updateUserStatus(req.params.userId, req.body.action);
  } catch (error) {
    return fail(res, error.message, 400);
  }
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  return ok(res, user);
}

export async function flaggedJobs(req, res) {
  return ok(res, await listFlaggedJobs(req.query));
}

export async function moderateJob(req, res) {
  let job;
  try {
    job = await moderateFlaggedJob(req.params.jobId, req.body);
  } catch (error) {
    return fail(res, error.message, 400);
  }
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  return ok(res, job);
}

export async function disputes(req, res) {
  return ok(res, await listDisputes(req.query));
}

export async function disputeRuling(req, res) {
  let dispute;
  try {
    dispute = await ruleOnDispute(req.params.disputeId, req.body);
  } catch (error) {
    return fail(res, error.message, 400);
  }
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

  return ok(res, dispute);
}

export async function controls(req, res) {
  return ok(res, await getPlatformControls());
}

export async function updateControl(req, res) {
  const nextControls = await updatePlatformControl(req.params.key, req.body.enabled);
  if (!nextControls) return res.status(404).json({ success: false, message: "Control not found" });

  return ok(res, nextControls);
}

export async function notifications(req, res) {
  return ok(res, await listAdminNotifications());
}
