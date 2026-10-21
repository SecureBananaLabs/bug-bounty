import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res, next) {
  try {
    return ok(res, await listNotifications());
  } catch (err) {
    next(err);
  }
}

export async function postNotification(req, res, next) {
  try {
    const validated = createNotificationSchema.parse(req.body);
    const notification = await createNotification(validated);
    return ok(res, notification, 201);
  } catch (err) {
    next(err);
  }
}
