import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getNotifications, postNotification } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", catchAsync(getNotifications));
notificationRoutes.post("/", catchAsync(postNotification));
