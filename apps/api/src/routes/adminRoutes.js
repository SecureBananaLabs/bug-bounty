import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import adminOnly from "../middleware/adminOnly.js";
import {
  metrics,
  settings_read,
  settings_update,
  users_list,
  users_get,
  users_updateStatus,
  users_updateRole,
  jobs_list,
  jobs_updateStatus,
  disputes_list,
  disputes_resolve,
  audit_list,
  flags_list,
  flags_clear,
} from "../controllers/adminController.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, adminOnly);

// Metrics
router.get("/metrics", metrics);

// Platform settings
router.get("/settings", settings_read);
router.patch("/settings", settings_update);

// Users
router.get("/users", users_list);
router.get("/users/:userId", users_get);
router.patch("/users/:userId/status", users_updateStatus);
router.patch("/users/:userId/role", users_updateRole);

// Jobs
router.get("/jobs", jobs_list);
router.patch("/jobs/:jobId/status", jobs_updateStatus);

// Disputes
router.get("/disputes", disputes_list);
router.post("/disputes/:disputeId/resolve", disputes_resolve);

// Audit log
router.get("/audit", audit_list);

// Flags
router.get("/flags", flags_list);
router.delete("/flags/:type/:id", flags_clear);

export default router;
