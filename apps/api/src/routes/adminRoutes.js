import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  metrics,
  listUsers,
  userDetail,
  suspend,
  reinstate,
  ban,
  flaggedJobs,
  moderate,
  disputes,
  resolve,
  settings,
  updateSetting,
  auditLogs,
} from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(adminAuth);

adminRoutes.get("/metrics", metrics);

adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.patch("/users/:id/suspend", suspend);
adminRoutes.patch("/users/:id/reinstate", reinstate);
adminRoutes.patch("/users/:id/ban", ban);

adminRoutes.get("/jobs/flagged", flaggedJobs);
adminRoutes.patch("/jobs/:id/moderate", moderate);

adminRoutes.get("/disputes", disputes);
adminRoutes.patch("/disputes/:id/resolve", resolve);

adminRoutes.get("/settings", settings);
adminRoutes.patch("/settings/:key", updateSetting);

adminRoutes.get("/audit-log", auditLogs);
