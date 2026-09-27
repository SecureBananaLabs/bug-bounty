import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const result = createNotificationSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid notification payload", 400);
  }

  return ok(res, await createNotification(result.data), 201);
}
