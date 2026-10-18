import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

const notifLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", notifLimiter, postNotification);
