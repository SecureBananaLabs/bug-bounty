import { ok, fail } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { message } = req.body || {};
  if (!message || typeof message !== "string" || message.trim().length === 0) return fail(res, "Message required.", 400);
  if (message.length > 2000) return fail(res, "Message too long.", 400);

  return ok(res, await createNotification(req.body), 201);
}
