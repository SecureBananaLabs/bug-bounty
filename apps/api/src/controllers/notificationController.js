import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createNotificationSchema } from "../validators/workflow.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res, next) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    return ok(res, await createNotification(payload), 201);
  } catch (error) {
    return next(error);
  }
}
