<content>
import { ok, badRequest } from '../utils/response.js';
import { createNotificationSchema } from '../validators/notification.js';
import { createNotification } from '../services/notificationService.js';

export async function postNotification(req, res) {
  try {
    const payload = createNotificationSchema.parse(req.body);
    return ok(res, await createNotification(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getNotification(req, res) {
  // Implementation
}

export async function putNotification(req, res) {
  // Implementation
}

export async function deleteNotification(req, res) {
  // Implementation
}