import { fail, ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  if (typeof req.body?.message !== "string" || req.body.message.trim() === "") {
    return fail(res, "Notification message is required");
  }

  return ok(res, await createNotification(req.body), 201);
}
