import { Router } from "express";
import {
  getNotifications,
  postNotification,
  patchReadAllNotifications,
} from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
notificationRoutes.patch("/read-all", patchReadAllNotifications);
