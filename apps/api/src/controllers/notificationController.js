import { fail, ok } from "../utils/response.js";
import { validateCreateNotification } from "../validators/notification.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { valid, data, message } = validateCreateNotification(req.body);

  if (!valid) {
    return fail(res, message, 400);
  }

  return ok(res, await createNotification(data), 201);
}
