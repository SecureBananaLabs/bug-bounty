import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  // Derive userId from authenticated user, ignore client-supplied value
  const { userId: _userId, ...rest } = req.body;
  const payload = { ...rest, userId: req.user.sub };
  return ok(res, await createNotification(payload), 201);
}
