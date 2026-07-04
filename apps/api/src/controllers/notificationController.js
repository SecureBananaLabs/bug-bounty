import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/notification.js";

export async function getNotifications(req, res, next) {
  try {
    return ok(res, await listNotifications());
  } catch (error) {
    next(error);
  }
}

export async function postNotification(req, res, next) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    const result = await createNotification(payload);
    return ok(res, result, 201);
  } catch (error) {
    next(error);
  }
}
