import { Router } from "express";
import {
  audit,
  controls,
  disputes,
  metrics,
  moderation,
  updateControl,
  updateDispute,
  updateListing,
  updateUser,
  users
} from "../controllers/adminController.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

adminRoutes.use(authMiddleware);
adminRoutes.use(adminOnly);

adminRoutes.get("/metrics", asyncRoute(metrics));
adminRoutes.get("/users", asyncRoute(users));
adminRoutes.patch("/users/:id/status", asyncRoute(updateUser));
adminRoutes.get("/moderation", asyncRoute(moderation));
adminRoutes.patch("/moderation/:id", asyncRoute(updateListing));
adminRoutes.get("/disputes", asyncRoute(disputes));
adminRoutes.patch("/disputes/:id", asyncRoute(updateDispute));
adminRoutes.get("/controls", asyncRoute(controls));
adminRoutes.patch("/controls/:key", asyncRoute(updateControl));
adminRoutes.get("/audit", asyncRoute(audit));
