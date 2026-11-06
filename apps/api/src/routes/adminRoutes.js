import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  metrics,
  getUsers,
  patchUserStatus,
  getFlaggedJobs,
  patchFlaggedJob,
  getDisputes,
  patchDispute,
  patchPlatformControl
} from "../controllers/adminController.js";

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
});

adminRoutes.get("/metrics",                        metrics);
adminRoutes.get("/users",                          getUsers);
adminRoutes.patch("/users/:userId/status",         patchUserStatus);
adminRoutes.get("/flags",                          getFlaggedJobs);
adminRoutes.patch("/flags/:flagId",                patchFlaggedJob);
adminRoutes.get("/disputes",                       getDisputes);
adminRoutes.patch("/disputes/:disputeId",          patchDispute);
adminRoutes.patch("/controls/:control",            patchPlatformControl);
