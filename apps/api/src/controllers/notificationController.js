import { fail, ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { userId, type, message } = req.body ?? {};

  if (typeof userId !== "string" || userId.trim() === "") {
    return fail(res, "userId is required", 400);
  }

  if (typeof type !== "string" || type.trim() === "") {
    return fail(res, "type is required", 400);
  }

  if (typeof message !== "string" || message.trim() === "") {
    return fail(res, "message is required", 400);
  }

  return ok(res, await createNotification(req.body), 201);
}
