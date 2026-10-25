import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", authMiddleware, getNotifications);
notificationRoutes.post("/", postNotification);
