import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const message = req.body?.message;
  if (!message || typeof message !== "string" || !message.trim()) {
    return fail(res, "Notification message is required and must be a non-empty string", 400);
  }
  return ok(res, await createNotification({ message: message.trim() }), 201);
}