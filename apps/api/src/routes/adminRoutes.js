import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";
import { metrics, users, updateUserHandler, jobs, updateJobHandler, disputes, resolveDisputeHandler, health } from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.patch("/users/:id", updateUserHandler);
adminRoutes.get("/jobs", jobs);
adminRoutes.patch("/jobs/:id", updateJobHandler);
adminRoutes.get("/disputes", disputes);
adminRoutes.post("/disputes/:id/resolve", resolveDisputeHandler);
adminRoutes.get("/health", health);