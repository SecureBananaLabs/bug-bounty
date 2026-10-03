import { ok } from "../utils/response.js";
import {
  createNotification,
  listNotifications,
  markAllAsRead,
} from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(req.body), 201);
}

export async function patchReadAllNotifications(req, res) {
  const userId = req.user?.id || req.body?.userId || req.query?.userId;
  const result = await markAllAsRead(userId);
  return ok(res, result);
}
