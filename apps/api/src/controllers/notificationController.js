import { ok } from "../utils/response.js";
const { createNotificationSchema } = require('../validators/notification');
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
    const parsed = createNotificationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const notification = await notificationService.createNotification(parsed.data);
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(req.body), 201);
}
