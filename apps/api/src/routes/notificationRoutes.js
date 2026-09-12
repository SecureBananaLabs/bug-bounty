import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

notificationRoutes.use(authMiddleware);

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
