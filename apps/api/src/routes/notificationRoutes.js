import { Router } from "express";
import { getNotifications, postNotification, getNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
notificationRoutes.get("/:id", getNotification);
