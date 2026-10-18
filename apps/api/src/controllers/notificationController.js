import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { notificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const result = notificationSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await createNotification(result.data), 201);
}
