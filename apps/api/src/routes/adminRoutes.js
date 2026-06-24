import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return fail(res, "Forbidden: Admin access required", 403);
  }
  next();
});
adminRoutes.get("/metrics", metrics);
