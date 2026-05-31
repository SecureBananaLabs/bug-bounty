import { fail, ok } from "../utils/response.js";
import {
  banAdminUser,
  getAdminDispute,
  getAdminMetrics,
  getAdminUserProfile,
  listAdminDisputes,
  listAdminUsers,
  listFlaggedJobs,
  moderateJob,
  reinstateAdminUser,
  resolveAdminDispute,
  suspendAdminUser
} from "../services/adminService.js";

function readStatusError(error, res) {
  if (typeof error?.status === "number") {
    return fail(res, error.message, error.status);
  }

  console.error("Unhandled admin error:", error);
  return fail(res, "Unexpected server error", 500);
}

function readQueryString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBodyReason(body) {
  return readQueryString(body?.reason);
}

export async function getUsers(req, res) {
  try {
    const result = await listAdminUsers({
      search: readQueryString(req.query.search),
      role: readQueryString(req.query.role),
      status: readQueryString(req.query.status),
      joinDate: readQueryString(req.query.joinDate),
      joinedAfter: readQueryString(req.query.joinedAfter),
      joinedBefore: readQueryString(req.query.joinedBefore)
    });
    return ok(res, result);
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function getUser(req, res) {
  try {
    return ok(res, await getAdminUserProfile(req.params.userId));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function suspendUser(req, res) {
  try {
    return ok(res, await suspendAdminUser(req.params.userId, { reason: readBodyReason(req.body) }, req.admin?.id));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function reinstateUser(req, res) {
  try {
    return ok(res, await reinstateAdminUser(req.params.userId, req.admin?.id));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function banUser(req, res) {
  try {
    return ok(res, await banAdminUser(req.params.userId, { reason: readBodyReason(req.body) }, req.admin?.id));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function getFlaggedJobs(req, res) {
  try {
    return ok(res, await listFlaggedJobs());
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function moderateFlaggedJob(req, res) {
  try {
    return ok(
      res,
      await moderateJob(
        req.params.jobId,
        {
          action: readQueryString(req.body?.action),
          reason: readBodyReason(req.body)
        },
        req.admin?.id
      )
    );
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function getDisputes(req, res) {
  try {
    return ok(res, await listAdminDisputes({ status: readQueryString(req.query.status) }));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function getDispute(req, res) {
  try {
    return ok(res, await getAdminDispute(req.params.disputeId));
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function resolveDispute(req, res) {
  try {
    return ok(
      res,
      await resolveAdminDispute(
        req.params.disputeId,
        {
          decision: readQueryString(req.body?.decision),
          reason: readBodyReason(req.body)
        },
        req.admin?.id
      )
    );
  } catch (error) {
    return readStatusError(error, res);
  }
}

export async function getMetrics(req, res) {
  try {
    return ok(res, await getAdminMetrics(req.query));
  } catch (error) {
    return readStatusError(error, res);
  }
}
