import { ok, fail } from "../utils/response.js";
import {
  createNotification,
  listNotifications,
  markAllAsRead,
} from "../services/notificationService.js";
import { validateCreateNotification } from "../validators/notification.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const validation = validateCreateNotification(req.body);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createNotification(validation.data), 201);
}

export async function patchReadAllNotifications(req, res) {
  const userId = req.user?.id || req.body?.userId || req.query?.userId;
  const result = await markAllAsRead(userId);
  return ok(res, result);
}
