import { Router } from "express";
import { getNotifications, postNotification } from "../controllers/notificationController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ userId: z.string().min(1), type: z.string().min(1), message: z.string().min(1) }).strict();

export const notificationRoutes = Router();

notificationRoutes.get("/", getNotifications);
notificationRoutes.post("/", validate(schema), postNotification);
