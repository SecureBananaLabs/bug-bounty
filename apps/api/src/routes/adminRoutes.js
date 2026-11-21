import { Router } from "express";
import { signAccessToken } from "../utils/jwt.js";
import { ok } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  metrics, users, userDetail, userSuspend, userReinstate, userBan,
  moderation, moderationApprove, moderationReject,
  disputes, disputeDetail, disputeRule,
  controls, controlsUpdate, auditLog,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// Dev-only: generate admin JWT for local testing
adminRoutes.post("/dev-login", (req, res) => {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  return ok(res, { token });
});

adminRoutes.use(authMiddleware);

adminRoutes.get("/metrics", metrics);

adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.post("/users/:id/suspend", userSuspend);
adminRoutes.post("/users/:id/reinstate", userReinstate);
adminRoutes.post("/users/:id/ban", userBan);

adminRoutes.get("/moderation", moderation);
adminRoutes.post("/moderation/:id/approve", moderationApprove);
adminRoutes.post("/moderation/:id/reject", moderationReject);

adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", disputeDetail);
adminRoutes.post("/disputes/:id/rule", disputeRule);

adminRoutes.get("/controls", controls);
adminRoutes.put("/controls", controlsUpdate);

adminRoutes.get("/audit-log", auditLog);
