import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";
import { ZodError } from "zod";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res, next) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    return ok(res, await createNotification(payload), 201);
  } catch (err) {
    if (err instanceof ZodError || err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: err.issues
      });
    }
    if (next) return next(err);
    throw err;
  }
}
