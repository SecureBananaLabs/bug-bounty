import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { userId, title, body } = req.body;
  if (!userId || typeof userId !== 'string' || userId.trim() === '' ||
      !title || typeof title !== 'string' || title.trim() === '' ||
      !body || typeof body !== 'string' || body.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid required fields: userId, title, and body are required."
    });
  }
  return ok(res, await createNotification(req.body), 201);
}
