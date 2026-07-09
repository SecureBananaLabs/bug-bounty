import { Router } from "express";
import * as adminCtrl from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admins only", 403);
  }
  next();
});

adminRoutes.get("/metrics", adminCtrl.metrics);

// Users
adminRoutes.get("/users", adminCtrl.getUsers);
adminRoutes.post("/users/:id/:action", adminCtrl.updateUser);

// Jobs
adminRoutes.get("/jobs/flagged", adminCtrl.getFlaggedJobs);
adminRoutes.post("/jobs/:id/:action", adminCtrl.moderateJob);

// Disputes
adminRoutes.get("/disputes", adminCtrl.getDisputes);
adminRoutes.post("/disputes/:id/:action", adminCtrl.moderateDispute);

// Controls
adminRoutes.get("/controls", adminCtrl.getControls);
adminRoutes.post("/controls", adminCtrl.updateControls);

// Audit Log
adminRoutes.get("/audit", adminCtrl.getAuditLog);
