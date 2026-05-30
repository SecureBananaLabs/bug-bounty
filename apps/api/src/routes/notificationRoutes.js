import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", requireAuth, getNotifications);
notificationRoutes.post("/", requireAuth, postNotification);