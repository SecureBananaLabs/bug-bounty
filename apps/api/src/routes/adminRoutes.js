import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);

// Example of how adminMiddleware could be implemented:
// const adminMiddleware = (req, res, next) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ error: "Access denied. Admins only." });
//   }
//   next();
// };
