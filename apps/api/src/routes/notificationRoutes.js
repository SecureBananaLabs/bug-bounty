import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

notificationRoutes.use(authMiddleware);
notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);