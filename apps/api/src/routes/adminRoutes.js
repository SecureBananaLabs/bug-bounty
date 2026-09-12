import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.route("/metrics")
  .get(metrics)
  .all(methodNotAllowed(["GET"]));
