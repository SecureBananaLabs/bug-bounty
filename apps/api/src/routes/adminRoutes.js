import { Router } from "express";
import { fail } from "../utils/response.js";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin role required", 403);
  }
  return next();
});
adminRoutes.get("/metrics", metrics);
