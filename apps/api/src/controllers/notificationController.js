import { ZodError } from "zod";
import { ok, fail } from "../utils/response.js";
import { createNotificationSchema } from "../validators/notification.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    return ok(res, await createNotification(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map((e) => e.message).join("; "), 400);
    }
    throw err;
  }
}
