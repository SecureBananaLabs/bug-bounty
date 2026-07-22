import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications(req.user));
}

export async function postNotification(req, res) {
  const parsed = createNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Invalid request", 400);
  }

  return ok(res, await createNotification(parsed.data, req.user), 201);
}
