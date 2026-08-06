import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { userId, title, body } = req.body;
  return ok(res, await createNotification({ userId, title, body }), 201);
}
