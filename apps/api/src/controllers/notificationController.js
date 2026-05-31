import { ZodError } from "zod";
import { ok } from "../utils/response.js";
import { createNotificationSchema } from "../validators/notification.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    return ok(res, await createNotification(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    throw err;
  }
}
