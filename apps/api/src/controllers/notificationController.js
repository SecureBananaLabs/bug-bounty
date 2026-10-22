import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  return ok(res, await listNotifications({ page, limit }));
}

export async function postNotification(req, res) {
  return ok(res, await createNotification(req.body), 201);
}
