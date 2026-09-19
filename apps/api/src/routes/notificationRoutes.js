import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const notificationRoutes = Router();

notificationRoutes.route("/")
  .get(getNotifications)
  .post(postNotification)
  .all(methodNotAllowed(["GET", "POST"]));
