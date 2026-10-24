import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getDisputeDetail,
  getPlatformControls,
  getUserProfile,
  listAuditLog,
  listDisputes,
  listFlaggedListings,
  listUsers,
  moderateListing,
  ruleDispute,
  updatePlatformControl,
  updateUserStatus
} from "../services/adminService.js";

function respond(handler, status = 200) {
  return async (req, res, next) => {
    try {
      return ok(res, await handler(req), status);
    } catch (error) {
      return next(error);
    }
  };
}

export const metrics = respond(() => getAdminMetrics());
export const users = respond((req) => listUsers(req.query));
export const userProfile = respond((req) => getUserProfile(req.params.id));
export const setUserStatus = respond((req) =>
  updateUserStatus(req.params.id, req.body.status, req.user, req.body.reason)
);
export const flaggedListings = respond((req) => listFlaggedListings(req.query));
export const setListingDecision = respond((req) =>
  moderateListing(req.params.id, req.body.decision, req.user, req.body.reason)
);
export const disputes = respond((req) => listDisputes(req.query));
export const disputeDetail = respond((req) => getDisputeDetail(req.params.id));
export const setDisputeRuling = respond((req) =>
  ruleDispute(req.params.id, req.body.ruling, req.user, req.body.reason)
);
export const controls = respond(() => getPlatformControls());
export const setControl = respond((req) =>
  updatePlatformControl(req.params.key, req.body.enabled, req.body.confirmation, req.user)
);
export const auditLog = respond((req) => listAuditLog(req.query));
