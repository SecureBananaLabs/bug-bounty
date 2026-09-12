import { ok } from "../utils/response.js";
import { notificationSchema } from "../validators/notification.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const payload = notificationSchema.parse(req.body);
  return ok(res, await createNotification(payload), 201);
}