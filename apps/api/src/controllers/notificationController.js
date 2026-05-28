import { createNotificationSchema } from "../validators/notification.js";
import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(createNotificationSchema.parse(req.body)), 201);
}
