import { ok, fail } from "../utils/response.js";
import { validateCreateNotification } from "../validators/notification.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const validation = validateCreateNotification(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createNotification(validation.data), 201);
}

