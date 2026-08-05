import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

// GET returns notifications — scope to authenticated user
notificationRoutes.get("/", authMiddleware, getNotifications);
notificationRoutes.post("/", authMiddleware, postNotification);
