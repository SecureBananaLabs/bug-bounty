import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

// SECURITY: enforce admin role after authentication. authMiddleware only validates
// the token; it does not authorize the user for privileged routes.
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin role required" });
  }
  next();
});

adminRoutes.get("/metrics", metrics);
