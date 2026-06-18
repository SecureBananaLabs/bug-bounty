import { validateSchema } from "../middleware/validationMiddleware.js";
import { NotificationSchema } from "../schemas/validationSchemas.js";
import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
