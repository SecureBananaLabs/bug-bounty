import { ok } from "../utils/response.js";
import {
  decideFlaggedListing,
  getAdminMetrics,
  getDispute,
  getPlatformSettings,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listModerationQueue,
  listUsers,
  ruleDispute,
  updatePlatformSettings,
  updateUserStatus
} from "../services/adminService.js";

function send(handler, status = 200) {
  return (req, res, next) => {
    try {
      return ok(res, handler(req), status);
    } catch (error) {
      return next(error);
    }
  };
}

export const metrics = send(() => getAdminMetrics());
export const users = send((req) => listUsers(req.query));
export const userProfile = send((req) => getUserProfile(req.params.userId));
export const updateUser = send((req) => updateUserStatus(req.params.userId, req.body, req.user));
export const moderation = send((req) => listModerationQueue(req.query));
export const decideModeration = send((req) => decideFlaggedListing(req.params.listingId, req.body, req.user));
export const disputes = send((req) => listDisputes(req.query));
export const dispute = send((req) => getDispute(req.params.disputeId));
export const decideDispute = send((req) => ruleDispute(req.params.disputeId, req.body, req.user));
export const settings = send(() => getPlatformSettings());
export const updateSettings = send((req) => updatePlatformSettings(req.body, req.user));
export const audit = send((req) => listAuditLog(req.query));
