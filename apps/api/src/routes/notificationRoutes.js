import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", authMiddleware, getNotifications);
notificationRoutes.post("/", postNotification);
