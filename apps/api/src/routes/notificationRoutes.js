import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { validate } from "../middleware/validate.js";
import { createNotificationSchema } from "../validators/notification.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", validate(createNotificationSchema), postNotification);
