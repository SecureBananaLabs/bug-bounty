import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

// Fix #1464: Require authentication for all notification endpoints
notificationRoutes.use(authMiddleware);

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
