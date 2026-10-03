import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
