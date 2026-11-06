import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications, getNotificationById } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(req.body), 201);
}

export async function getNotification(req, res) {
  const notification = await getNotificationById(req.params.id);
  if (!notification) {
    return fail(res, "Notification not found", 404);
  }
  return ok(res, notification);
}
