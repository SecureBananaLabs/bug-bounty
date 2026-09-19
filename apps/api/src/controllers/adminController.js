import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getPlatformControls,
  getUserDetails,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  listUsers,
  moderateListing,
  ruleOnDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function adminId(req) {
  return req.user?.sub ?? req.user?.id ?? "admin";
}

function handle(handler) {
  return async (req, res, next) => {
    try {
      return await handler(req, res);
    } catch (error) {
      return next(error);
    }
  };
}

export const metrics = handle(async (req, res) => {
  return ok(res, await getAdminMetrics());
});

export const users = handle(async (req, res) => {
  return ok(res, await listUsers(req.query));
});

export const userDetails = handle(async (req, res) => {
  return ok(res, await getUserDetails(req.params.userId));
});

export const changeUserStatus = handle(async (req, res) => {
  return ok(
    res,
    await updateUserStatus(req.params.userId, {
      ...req.body,
      adminId: adminId(req)
    })
  );
});

export const moderationQueue = handle(async (req, res) => {
  return ok(res, await listFlaggedListings(req.query));
});

export const reviewListing = handle(async (req, res) => {
  return ok(
    res,
    await moderateListing(req.params.listingId, {
      ...req.body,
      adminId: adminId(req)
    })
  );
});

export const disputes = handle(async (req, res) => {
  return ok(res, await listDisputes(req.query));
});

export const resolveDispute = handle(async (req, res) => {
  return ok(
    res,
    await ruleOnDispute(req.params.disputeId, {
      ...req.body,
      adminId: adminId(req)
    })
  );
});

export const controls = handle(async (req, res) => {
  return ok(res, await getPlatformControls());
});

export const toggleControl = handle(async (req, res) => {
  return ok(
    res,
    await updatePlatformControl(req.params.controlKey, {
      ...req.body,
      adminId: adminId(req)
    })
  );
});

export const auditLog = handle(async (req, res) => {
  return ok(res, await listAuditLog(req.query));
});
