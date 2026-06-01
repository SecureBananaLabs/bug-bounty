import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import {
  metrics,
  listUsers,
  getUser,
  suspendUserAction,
  reinstateUserAction,
  banUserAction,
  listFlagged,
  approveFlag,
  rejectFlag,
  escalateFlag,
  listDisputesAction,
  getDispute,
  ruleOnDisputeAction,
  getSettings,
  updateSetting,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// Every admin endpoint requires auth + admin role
adminRoutes.use(authMiddleware, adminOnly);

// ── Dashboard / Metrics ─────────────────────────────────────────────────────
adminRoutes.get("/metrics", metrics);

// ── User Management ────────────────────────────────────────────────────────
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:userId", getUser);
adminRoutes.post("/users/:userId/suspend", suspendUserAction);
adminRoutes.post("/users/:userId/reinstate", reinstateUserAction);
adminRoutes.post("/users/:userId/ban", banUserAction);

// ── Job Moderation ─────────────────────────────────────────────────────────
adminRoutes.get("/flags", listFlagged);
adminRoutes.post("/flags/:flagId/approve", approveFlag);
adminRoutes.post("/flags/:flagId/reject", rejectFlag);
adminRoutes.post("/flags/:flagId/escalate", escalateFlag);

// ── Dispute Resolution ─────────────────────────────────────────────────────
adminRoutes.get("/disputes", listDisputesAction);
adminRoutes.get("/disputes/:disputeId", getDispute);
adminRoutes.post("/disputes/:disputeId/rule", ruleOnDisputeAction);

// ── Platform Settings ──────────────────────────────────────────────────────
adminRoutes.get("/settings", getSettings);
adminRoutes.patch("/settings", updateSetting);
