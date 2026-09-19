import { fail, ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const message = req.body?.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return fail(res, "Notification message is required", 400);
  }

  return ok(res, await createNotification({ ...req.body, message: message.trim() }), 201);
}
