import { Router } from "express";
import { getNotification, getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.get("/:id", getNotification);
notificationRoutes.post("/", postNotification);
