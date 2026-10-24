import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationRoutes = Router();

// A notification inbox belongs to one account, so both handlers need the
// verified bearer identity instead of answering every anonymous caller.
notificationRoutes.use(authMiddleware);
notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", postNotification);
