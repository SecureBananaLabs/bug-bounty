import { createNotificationSchema } from "../validators/notification.js";
import { fail, ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const payload = createNotificationSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid notification request", 400);
  }

  return ok(res, await createNotification(payload.data), 201);
}
