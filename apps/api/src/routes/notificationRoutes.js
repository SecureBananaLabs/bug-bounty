import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
