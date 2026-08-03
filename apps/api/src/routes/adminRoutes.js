import { Router } from "express";
import * as ctrl from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();
adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
});

adminRoutes.get("/metrics", ctrl.metrics);
adminRoutes.get("/users", ctrl.listUsers);
adminRoutes.get("/users/:id", ctrl.getUserDetail);
adminRoutes.patch("/users/:id/status", ctrl.updateUserStatus);
adminRoutes.get("/jobs/flagged", ctrl.listFlaggedJobs);
adminRoutes.post("/jobs/:id/moderate", ctrl.moderateJob);
adminRoutes.get("/disputes", ctrl.listDisputes);
adminRoutes.get("/disputes/:id", ctrl.getDisputeDetail);
adminRoutes.post("/disputes/:id/resolve", ctrl.resolveDispute);
adminRoutes.get("/controls", ctrl.getControls);
adminRoutes.put("/controls", ctrl.updateControls);
