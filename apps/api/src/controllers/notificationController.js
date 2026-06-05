import { createNotificationSchema } from "../validators/notification.js";
import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const parsed = createNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues[0]?.message ?? "Invalid notification", 400);
  }

  return ok(res, await createNotification(parsed.data), 201);
}
