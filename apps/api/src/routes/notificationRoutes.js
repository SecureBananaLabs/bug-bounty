import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
notificationRoutes.all("/", methodNotAllowed(["GET", "POST"]));
