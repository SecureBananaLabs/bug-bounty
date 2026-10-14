import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const payload = createNotificationSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: payload.error.issues
    });
  }

  return ok(res, await createNotification(payload.data), 201);
}
