import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

// Notifications are per-account, so both reads and writes need the verified
// bearer identity rather than an anonymous reply.
notificationRoutes.use(authMiddleware);
notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
