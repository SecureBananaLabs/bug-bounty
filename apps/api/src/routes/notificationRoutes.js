import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", asyncHandler(getNotifications));
notificationRoutes.post("/", asyncHandler(postNotification));
